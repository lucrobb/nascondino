import React from "react";

type ErrorBoundaryProps = {
    children: React.ReactNode;
};

type ErrorBoundaryState = {
    error: Error | null;
};

export class GameErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    state: ErrorBoundaryState = {
        error: null,
    };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <div className="fixed inset-0 z-[9999] overflow-auto bg-black p-6 text-white">
                    <h1 className="mb-4 text-2xl font-bold">
                        Errore
                    </h1>

                    <pre className="whitespace-pre-wrap break-words text-sm">
                        {this.state.error.message}
                        {"\n\n"}
                        {this.state.error.stack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}