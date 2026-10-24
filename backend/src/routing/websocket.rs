use hyper::{Request, StatusCode}
use hyper_tungstenite;

use crate::types::{RegistryCommand, RoomHandle};

pub async fn handle_websocket_connection(request: Request<Incoming>, path: &str, registry_handle: RegistryHandle) -> HttpResponse {
    let segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    if segments.len() != 3 || segments[0] != "lobby" {
        return error_response(StatusCode::BAD_REQUEST, "URL invalido per connessione alla lobby");
    }

    let room_code = segments[1].to_string();
    let player_id = segments[2].to_string();

    let (reply_tx, reply_rx) = oneshot::channel::<Option<RoomHandle>>();
    if let Err(_) = registry_handle.send(RegistryCommand::GetHandle { room_code, reply_tx }).await {
        eprintln!("Error sending room request to registry");
        return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Errore nella ricerca della lobby");
    }

    let room_handle = match reply_rx.await {
        Ok(Some(handle)) => handle,
        Ok(None) => {
            eprintln!("Lobby not found");
            return error_response(StatusCode::NOT_FOUND, "Lobby non trovata");
        }
        Err(_) => {
            eprintln!("Error receiving room handle from registry");
            return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Errore nella ricerca della lobby");
        }
    };

    let (response, websocket) = match hyper_tungstenite::upgrade(request, None) {
        Ok((response, websocket)) => (response, websocket),
        Err(error) => {
            eprintln!("WebSocket upgrade failed: {error}");
            return error_response(StatusCode::BAD_REQUEST, "Richiesta di connessione invalida");
        }
    };

    tokio::spawn(async move {
        match websocket.await {
            Ok(ws) => {
                handle_connection(ws, room_handle, player_id).await;
            },
            Err(e) => {
                eprintln!("Websocket connection failed: {e}");
            }
        }
    });

    return response;
}