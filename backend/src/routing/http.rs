use crate::types::{RegistryCommand, RegistryHandle, ServerMessage, HttpResponse};
use crate::protocol::{http_response, error_response};
use tokio::sync::oneshot;
use hyper::StatusCode;

pub async fn get_lobby(room_code: &str, registry_handle: RegistryHandle) -> HttpResponse {
    let (reply_tx, reply_rx) = oneshot::channel::<bool>();
    if let Err(_) = registry_handle.send(
        RegistryCommand::CheckLobbyExists { room_code: room_code.to_string(), reply_tx }
    ).await {
        eprintln!("Failed to send room search command");
        return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Error nella ricerca della lobby")
    }

    match reply_rx.await {
        Ok(true) => {
            return http_response(ServerMessage::LobbyResult { room_code: room_code.to_string() });
        },
        Ok(false) => {
            return error_response(
                StatusCode::NOT_FOUND,
                "Lobby non trovata",
            );
        },
        Err(_) => {
            eprintln!("Error receiving room code");
            return error_response(
                StatusCode::INTERNAL_SERVER_ERROR, 
                "Errore nella ricerca della lobby",
            );
        }
    }
}

pub async fn create_lobby(registry_handle: RegistryHandle) -> HttpResponse {
    let (reply_tx, reply_rx) = oneshot::channel::<String>();
    if let Err(_) = registry_handle.send(
        RegistryCommand::CreateLobby { reply_tx }
    ).await {
        eprintln!("Failed to send create room command");
        return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Richiesta di creazione fallita");
    }

    match reply_rx.await {
        Ok(room_code) => {
            return http_response(ServerMessage::LobbyResult { room_code });
        },
        Err(_) => {
            eprintln!("Error creating room");
            return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Errore nella creazione della lobby");
        }
    }
}