mod constants;
mod consumer;
mod protocol;
mod room_registry;
mod room;
mod types;
mod vision;
mod routing;

use std::env;

use tokio::net::TcpListener;
use tokio::sync::mpsc; //Async tasks handling

use hyper::service::service_fn;
use hyper::server::conn::http1;
use hyper_util::rt::TokioIo;

use crate::routing::connection::handle_request;
use crate::room_registry::run_registry;


#[tokio::main]
async fn main() {
    //spawn room registry before opening HTTP listener
    let (registry_tx, registry_rx) = mpsc::channel(100);
    tokio::spawn(run_registry(registry_rx, registry_tx.clone()));

    let port = match env::var("PORT").unwrap_or("8080".to_string()).parse::<u16>() {
        Ok(port) => port,
        Err(e) => {
            eprintln!("Error parsing port: {e}");
            return;
        }
    };

    let listener = match TcpListener::bind(format!("0.0.0.0:{port}")).await {
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

        let registry_handle = registry_tx.clone();
        tokio::spawn(async move{
            let io = TokioIo::new(stream);

            let service = service_fn(move |request| {
                handle_request(request, registry_handle.clone())
            });

            let connection = http1::Builder::new()
                .serve_connection(io, service)
                .with_upgrades();

            if let Err(error) = connection.await {
                eprintln!("Connection error: {error}");
            }
        });
    }
}
