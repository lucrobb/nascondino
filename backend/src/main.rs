mod constants;
mod consumer;
mod protocol;
mod room_registry;
mod room;
mod types;
mod vision;

use tokio::net::{TcpListener, TcpStream}; //TCP listener
use tokio::sync::{mpsc, oneshot}; //Async tasks handling

use std::convert::Infallible;

use http_body_util::Full;
use hyper::body::Bytes;
use hyper::service::service_fn;
use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;



use crate::routing::http::handle_http_request;
use crate::routing::ws::handle_ws_handshake;
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
        let (stream, address) = match listener.accept().await {
            Ok((s, a)) => (s, a),
            Err(e) => {
                eprintln!("Error accepting connection: {e}");
                continue;
            }
        };

        println!("New connection from {address}");

        tokio::spawn(async move {
            let io = TokioIo::new(stream);

            let service = service_fn(handle_request);

            let connection = http1::Builder::new()
                .serve_connection(io, service)
                .with_upgrades();

            if let Err(error) = connection.await {
                eprintln!("Connection error: {error}");
            }
        });
    }
}



