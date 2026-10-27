use std::collections::HashMap;
use tokio::sync::mpsc;

use crate::room::Room;
use crate::types::{RegistryHandle, RegistryInbox, RegistryCommand, RoomHandle, RoomCommand};

use rand::{rng, RngExt};

fn generate_room_code() -> String {
    const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let mut rng = rng();

    (0..6)
        .map(|_| {
            let index = rng.random_range(0..CHARSET.len());
            CHARSET[index] as char
        })
        .collect()
}
fn generate_unique_room_code(
    rooms: &HashMap<String, RoomHandle>,
) -> String {
    loop {
        let code = generate_room_code();

        if !rooms.contains_key(&code) {
            return code;
        }
    }
}

pub async fn run_registry(mut inbox: RegistryInbox, registry_tx: RegistryHandle) {
    let mut rooms: HashMap<String, RoomHandle> = HashMap::new();

    while let Some(command) = inbox.recv().await {
        match command {
            RegistryCommand::CheckLobbyExists { room_code, reply_tx } => {
                let result = rooms.contains_key(&room_code);
                if let Err(e) = reply_tx.send(result) {
                    eprintln!("Error sending back lobby existence result: {e}");
                }
            },
            RegistryCommand::CreateLobby { reply_tx } => {
                let (room_tx, room_rx) = mpsc::channel::<RoomCommand>(100);
                let room_code = generate_unique_room_code(&rooms);
                let room = Room::new(room_rx, registry_tx.clone(), room_code.clone());

                rooms.insert(room_code.clone(), room_tx);
                tokio::spawn(async move {
                    room.run().await;
                });

                if let Err(e) = reply_tx.send(room_code) {
                    eprintln!("Failed to send room code of created lobby: {e}");
                }
            }
            RegistryCommand::GetHandle { room_code, reply_tx } => {
                let room_handle: Option<RoomHandle> = rooms.get(&room_code).cloned();

                if let Err(_) = reply_tx.send(room_handle) {
                    eprintln!("Error sending room handle");
                }
            }
            RegistryCommand::EndGame { room_code } => {
                rooms.remove(&room_code);
            },
        }  
    }
}