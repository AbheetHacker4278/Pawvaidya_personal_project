import React from 'react';

const RunningDogLoader = () => {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-32 h-32">
                <img
                    src="https://media.tenor.com/On7kvXhzml4AAAAj/loading-gif.gif"
                    alt="Loading..."
                    className="w-full h-full object-contain mix-blend-multiply"
                />
            </div>
            <p className="text-[#5A4035] font-bold mt-2 animate-pulse text-lg">
                Fetching details...
            </p>
        </div>
    );
};

export default RunningDogLoader;
