
export function Lights() {
    return (
        <>
            <ambientLight intensity={0.3} />
            <directionalLight
                position={[15, 25, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-30}
                shadow-camera-right={30}
                shadow-camera-top={30}
                shadow-camera-bottom={-30}
            />
            <hemisphereLight args={["#87ceeb", "#3a3a3a", 0.4]} />
        </>
    );
}