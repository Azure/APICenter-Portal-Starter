import { FC } from "react";

interface GlobeIconProps {
    size?: number;
    color?: string;
    className?: string;
}

const GlobeIcon: FC<GlobeIconProps> = ({ size = 16, color = "currentColor", className }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox={"0 0 24 24"}
            fill={"none"}
            xmlns={"http://www.w3.org/2000/svg"}
            className={className}
        >
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
            <path d="M2 12h20" stroke={color} strokeWidth="2" />
            <path
                d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                stroke={color}
                strokeWidth="2"
                fill="none"
            />
        </svg>
    );
};

export default GlobeIcon;
