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
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
            />
        </>
    );
}