mod constants;
mod consumer;
mod protocol;
mod room_registry;
mod room;
mod types;
mod vision;

use tokio::net::{TcpListener, TcpStream}; //TCP listener
use tokio::sync::{mpsc, oneshot}; //Async tasks handling


//Implementing the websocket connection
use tokio_tungstenite::{WebSocketStream, accept_hdr_async};
use tokio_tungstenite::tungstenite::handshake::server::{Request, Response, ErrorResponse};
use tokio_tungstenite::tungstenite::http::StatusCode;

use std::error::Error;

use crate::room_registry::run_registry;
use crate::consumer::handle_connection;
use crate::types::{RoomHandle, RegistryCommand};


#[tokio::main]
async fn main() {
    //spawn room registry before opening HTTP listener
    let (registry_tx, registry_rx) = mpsc::channel(100);
    tokio::spawn(run_registry(registry_rx, registry_tx.clone()));

    let listener = match TcpListener::bind("127.0.0.1:8000").await {
        Ok(listener) => listener,
        Err(e) => {
            eprintln!("Couldn't bind the port: {e}");
            return;
        },
    };

    loop {
        let (stream, _) = match listener.accept().await {
            Ok(pair) => pair,
            Err(e) => {
                eprintln!("Accept failed: {e}");
                continue; //skip this connection, listen on the next ones
            },
        };

        let (ws, room_handle, player_id) = match ws_handshake(stream).await {
            Ok((ws, room_code, player_id)) => {

                let (reply_tx, reply_rx) = oneshot::channel::<RoomHandle>();
                if let Err(e) = registry_tx.send(RegistryCommand::GetOrCreate {
                    room_code: room_code.clone(),
                    reply_tx,
                }).await {
                    eprintln!("Error getting or creating room: {e}");
                    continue;
                }

                let room_handle = match reply_rx.await {
                    Ok(handle) => handle,
                    Err(_) => {
                        eprintln!("Error in room handle communication");
                        continue;
                    }
                };

                (ws, room_handle, player_id)
            },
            Err(e) => {
                eprintln!("Error obtaining url params: {e}");
                continue;
            },
        };

        tokio::spawn(async move { 
            handle_connection(ws, room_handle, player_id).await;
        });
    }
}

async fn ws_handshake(stream: TcpStream) -> Result<(WebSocketStream<TcpStream>, String, String), Box<dyn Error>> {
    let mut room_code = String::new();
    let mut player_id = String::new();

    let ws = accept_hdr_async(stream, |req: &Request, res: Response| -> Result<Response, ErrorResponse> {
        let path = req.uri().path();
        let segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();

        if segments.len() == 3 && segments[0] == "lobby"{
            room_code = segments[1].to_string();
            player_id = segments[2].to_string();

            println!("Connection made: Room {room_code}, Player {player_id}");
            return Ok(res);
        } else {
            let mut err = ErrorResponse::new(Some("Invalid url path".to_string()));
            *err.status_mut() = StatusCode::BAD_REQUEST;
            return Err(err);
        }
    }).await;

    match ws {
        Ok(ws) => Ok((ws, room_code, player_id)),
        Err(e) => Err(Box::new(e)),
    }
}

