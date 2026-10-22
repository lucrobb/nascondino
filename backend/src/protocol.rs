//For now we will maintain JSON for simplicity, observability and because it is already in use on the frontend
use crate::types::{ClientMessage, ServerMessage};

pub fn decode(data: &str) -> Result<ClientMessage, String> {
    match serde_json::from_str::<ClientMessage>(data) {
        Ok(message) => Ok(message),
        Err(e) => Err(e.to_string()),
    }
}

pub fn encode(data: &ServerMessage) -> Result<String, String> {
    match serde_json::to_string::<ServerMessage>(data) {
        Ok(message) => Ok(message),
        Err(e) => Err(e.to_string()),
    }
}
