use std::collections::HashMap;
use tokio::sync::mpsc;

use crate::room::Room;
use crate::types::{RegistryHandle, RegistryInbox, RegistryCommand, RoomHandle};


pub async fn run_registry(mut inbox: RegistryInbox, registry_tx: RegistryHandle) {
    let mut rooms: HashMap<String, RoomHandle> = HashMap::new();

    while let Some(command) = inbox.recv().await {
        match command {
            RegistryCommand::GetOrCreate { room_code, reply_tx } => {
                let room_handle: RoomHandle = match rooms.get(&room_code).cloned() {
                    Some(handle) => handle,
                    //Create a new room if one with the room code doesn't yet exist
                    None => {
                        let (room_handle, room_inbox) = mpsc::channel(100);
                        let room = Room::new(room_inbox, registry_tx.clone(), room_code.clone());

                        tokio::spawn(room.run());
                        rooms.insert(room_code, room_handle.clone());
                        room_handle
                    },
                };
                
                //Send the room handle back to the user using the oneshot channel
                if let Err(_) = reply_tx.send(room_handle) {
                    eprintln!("Error sending back the room handle");
                }
            },
            RegistryCommand::EndGame { room_code } => {
                rooms.remove(&room_code);
            },
        }  
    }
}