export function Lights() {
    return (
        <>
            <ambientLight intensity={0.25} />

            <hemisphereLight
                args={[
                    "#d8d4ca",
                    "#353534",
                    0.45,
                ]}
            />

            <directionalLight
                position={[15, 25, 10]}
                intensity={1.4}
                castShadow
                shadow-mapSize={[4096, 4096]}
                shadow-camera-left={-30}
                shadow-camera-right={30}
                shadow-camera-top={30}
                shadow-camera-bottom={-30}
                shadow-camera-near={0.1}
                shadow-camera-far={100}
            />
        </>
    );
}