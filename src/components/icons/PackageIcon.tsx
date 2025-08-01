import { FC } from "react";

interface PackageIconProps {
    size?: number;
    color?: string;
    className?: string;
}

const PackageIcon: FC<PackageIconProps> = ({ size = 16, color = "currentColor", className }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M2 17L12 22L22 17"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M2 12L12 17L22 12"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
};

export default PackageIcon;
