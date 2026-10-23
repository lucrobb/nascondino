

pub async fn get_lobby(room_code: &str, registry_handle: RegistryHandle) -> HttpResponse {
    let (reply_tx, reply_rx) = oneshot::channel::<Option<RoomHandle>>();
    if let Err(_) = registry_handle.send(
        RegistryCommand::GetLobby { room_code: room_code.to_string(), reply_tx }
    ).await {
        eprintln!("Failed to send room search command");
        return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Error nella ricerca della lobby")
    }

    match reply_rx.await {
        Ok(Some(code)) => {
            return http_response(ServerResponse::GetLobby { room_code: code });
        },
        Ok(None) => {
            eprintln!("Room not found");
            return error_response(StatusCode::BAD_REQUEST, "Lobby non trovata");
        },
        Err(e) => {
            eprintln!("Error receiving room code");
            return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Errore nella ricerca della lobby");
        }
    }
}

pub async fn create_lobby(registry_handle: RegistryHandle) -> HttpResponse {
    let (reply_tx, reply_rx) = oneshot::channel::<RoomHandle>();
    if let Err(_) = registry_handle.send(
        RegistryCommand::CreateLobby {}
    ).await {
        eprintln!("Failed to send create room command");
        return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Richiesta di creazione fallita");
    }

    match reply_rx.await {
        Ok(code) => {
            return http_response(ServerResponse::CreateLobby { room_code: code });
        },
        Err(_) => {
            eprintln!("Error creating room");
            return error_response(StatusCode::INTERNAL_SERVER_ERROR, "Errore nella creazione della lobby");
        }
    }
}