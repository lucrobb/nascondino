use tokio::io::{AsyncRead, AsyncWrite};
use tokio::sync::mpsc;
use hyper_tungstenite::tungstenite::Message;
use hyper_tungstenite::WebSocketStream;
use futures_util::stream::StreamExt;
use futures_util::SinkExt;

use crate::protocol::{decode, encode};
use crate::types::{RoomHandle, ClientMessage, RoomCommand, ConsumerCommand};

pub async fn handle_consumer<S>(
    ws: WebSocketStream<S>, 
    room_handle: RoomHandle, 
    player_id: String
) where S: AsyncRead + AsyncWrite + Unpin {
    let (my_tx, mut my_rx) = mpsc::channel(100);
    let (mut write, mut read) = ws.split();

    loop {
        //We use tokio::select! to accept the first message in arrival
        tokio::select! {
            client_message = read.next() => {
                //parsing the raw message (still to be written)
                let client_message = match client_message {
                    Some(Ok(message)) => message,
                    Some(Err(e)) => {
                        eprintln!("Websocket error for {player_id}: {e}");
                        break;
                    }
                    None => {
                        disconnect(player_id.clone(), &room_handle).await;
                        println!("Client {player_id} disconnected");
                        break;
                    }
                };

                if client_message.is_close() {
                    disconnect(player_id.clone(), &room_handle).await;
                    println!("Client {player_id} sent a close frame: {client_message}");
                    break;
                }

                let text = match client_message {
                    Message::Text(text) => text.to_string(),
                    _ => {
                        eprintln!("Expected a text message");
                        continue;
                    }
                };
                let message: ClientMessage = match decode(&text.as_bytes()) {
                    Ok(message) => message,
                    Err(e) => {
                        eprintln!("Error parsing client message: {e}");
                        continue;
                    }
                };   

                fn log_send_error(result: Result<(), mpsc::error::SendError<RoomCommand>>) {
                    if let Err(e) = result {
                        eprintln!("Failed to send room command: {e}");
                    }
                }

                match message {
                    ClientMessage::Join { name } => {
                        log_send_error(
                            room_handle.send(RoomCommand::Join {
                                player_id: player_id.clone(),
                                name,
                                consumer_tx: my_tx.clone(),
                            }).await,
                        );
                    },
                    ClientMessage::Move { position, facing } => {
                        log_send_error(
                            room_handle.send(RoomCommand::Move {
                                player_id: player_id.clone(),
                                position,
                                facing
                            }).await,
                        );
                    },
                    ClientMessage::CaptureAttempt { target_id } => {
                        log_send_error(
                            room_handle.send(RoomCommand::CaptureAttempt {
                                player_id: player_id.clone(),
                                target_id
                            }).await,
                        );
                    }

                    //Lobby host controls, pass the player_id for creator confirmation
                    ClientMessage::KickPlayer { kick_id } => {
                        log_send_error(
                            room_handle.send(RoomCommand::KickPlayer {
                                player_id: player_id.clone(),
                                kick_id
                            }).await,
                        );
                    },
                    ClientMessage::StartGame => {
                        log_send_error(
                            room_handle.send(RoomCommand::StartGame { player_id: player_id.clone() }).await,
                        );
                    },
                    ClientMessage::EndGame => {
                        log_send_error(
                            room_handle.send(RoomCommand::EndGame { player_id: player_id.clone() }).await,
                        );
                    },
                }
            }

            room_message = my_rx.recv() => {
                let (message, should_kick) = match room_message {
                    Some(ConsumerCommand::Write { message }) => (message, false),
                    Some(ConsumerCommand::Kick { message }) => (message, true),
                    None => {
                        eprintln!("Room channel closed for {player_id}");
                        break;
                    },
                };

                let encoded = match encode(&message) {
                    Ok(text) => text,
                    Err(e) => {
                        eprintln!("Error encoding server message: {e}");
                        continue;
                    }
                };

                if let Err(e) = write.send(Message::Text(encoded.into())).await {
                    eprintln!("Error sending message to client {player_id}: {e}");
                    continue;
                }

                if should_kick {
                    break;
                }
            }
        }
    }
} 

//Handle disconnect (not triggered by kick message because room already removed client, not the same as disconnection)
async fn disconnect(player_id: String, room_handle: &RoomHandle) {
    if let Err(e) = room_handle.send(RoomCommand::Disconnect { player_id }).await {
        eprintln!("Failed to notify room of user disconnection: {e}");
    }
}
