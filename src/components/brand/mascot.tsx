import { cn } from "@/lib/utils";

export type MascotPose = "hello" | "study" | "review" | "progress" | "rest";

type MascotProps = {
  pose?: MascotPose;
  label?: string;
  className?: string;
};

export function Mascot({
  pose = "study",
  label,
  className,
}: MascotProps) {
  const isHidden = label === undefined;

  return (
    <svg
      viewBox="0 0 240 180"
      className={cn("h-40 w-56", className)}
      role={isHidden ? undefined : "img"}
      aria-hidden={isHidden ? "true" : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      {label ? <title>{label}</title> : null}
      <ellipse cx="121" cy="154" rx="72" ry="12" fill="#F1E8E1" />
      <path
        d="M47 119.5h132.5c18.4 0 33.3-12.8 33.3-28.6 0-14.1-11.8-25.8-27.4-28.1C180.5 39.2 159.9 21.5 135 21.5c-26.5 0-48.2 20-50.1 45.5C66.1 69.7 52 83.6 52 100.4c0 7 2.5 13.4 6.7 18.4H47Z"
        fill="#FFF8F2"
        stroke="#C65A3A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M78.5 70.5c8.8-24.2 29.7-38.2 55.2-37.2"
        fill="none"
        stroke="#F6C8B2"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {pose === "hello" ? <HelloArm /> : <LeftArm />}
      {pose === "progress" ? <PointerArm /> : <RightArm />}

      <Face pose={pose} />

      <path
        d="M94 141.5c-5.4 6.7-13.3 9.1-21.2 6.5"
        fill="none"
        stroke="#6B4B3E"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M143.5 143.5c5.7 6.1 13.3 8.1 20.7 5.2"
        fill="none"
        stroke="#6B4B3E"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {pose === "review" ? <ReviewCard /> : null}
      {pose === "study" ? <StudyBook /> : null}
      {pose === "progress" ? <ProgressChart /> : null}
      {pose === "rest" ? <RestMarks /> : null}
      {pose === "hello" ? <GreetingBubble /> : null}

      <Sparkles />
    </svg>
  );
}

function Face({ pose }: { pose: MascotPose }) {
  const resting = pose === "rest";

  return (
    <g>
      {resting ? (
        <>
          <path
            d="M93 91c5.2 3.3 10.4 3.3 15.5 0"
            fill="none"
            stroke="#2E1F1A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M139 91c5.2 3.3 10.4 3.3 15.5 0"
            fill="none"
            stroke="#2E1F1A"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="101" cy="91" r="5.2" fill="#2E1F1A" />
          <circle cx="146" cy="91" r="5.2" fill="#2E1F1A" />
        </>
      )}
      <circle cx="81" cy="106" r="6" fill="#F6C8B2" opacity="0.75" />
      <circle cx="166" cy="106" r="6" fill="#F6C8B2" opacity="0.75" />
      <path
        d="M112.5 105c3.4 3.6 7.3 5.4 11.6 5.4 4.2 0 8.1-1.8 11.5-5.4"
        fill="none"
        stroke="#C65A3A"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  );
}

function LeftArm() {
  return (
    <path
      d="M66.5 112c-11 4.3-20.2.6-26.5-10.4"
      fill="none"
      stroke="#C65A3A"
      strokeWidth="7"
      strokeLinecap="round"
    />
  );
}

function RightArm() {
  return (
    <path
      d="M174 113.5c11.3 4.4 20.9.7 27.6-10.6"
      fill="none"
      stroke="#C65A3A"
      strokeWidth="7"
      strokeLinecap="round"
    />
  );
}

function HelloArm() {
  return (
    <g>
      <path
        d="M70 103c-14.7-3.4-23-13.7-24.3-30.8"
        fill="none"
        stroke="#C65A3A"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M36 67.5c-4.3-2.6-7.1-6.1-8.4-10.5"
        fill="none"
        stroke="#C65A3A"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M50.8 65.7c1-4.8.1-9.1-2.7-12.7"
        fill="none"
        stroke="#C65A3A"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function PointerArm() {
  return (
    <path
      d="M169 111c12.8-8.1 20.8-18.9 24-32.5"
      fill="none"
      stroke="#C65A3A"
      strokeWidth="7"
      strokeLinecap="round"
    />
  );
}

function StudyBook() {
  return (
    <g>
      <path
        d="M83 119.5c15.2-5.8 29.6-3.8 43.2 6V150c-13.6-9.8-28-12.1-43.2-6.7v-23.8Z"
        fill="#FCEFE6"
        stroke="#C65A3A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M126.2 125.5c13.6-9.8 28-11.8 43.2-6V143c-15.2-5.4-29.6-3.1-43.2 6.7v-24.2Z"
        fill="#FFFDF9"
        stroke="#C65A3A"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M126.2 126v24" stroke="#C65A3A" strokeWidth="3" />
      <path
        d="M93 128h22M93 136h18M138 128h21M138 136h16"
        stroke="#E07A5F"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

function ReviewCard() {
  return (
    <g>
      <rect
        x="83"
        y="113"
        width="73"
        height="42"
        rx="7"
        fill="#FFFDF9"
        stroke="#C65A3A"
        strokeWidth="3"
      />
      <path
        d="M100 130h29M100 140h40"
        stroke="#6B4B3E"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M138 127l5.3 5.3L154 121.5"
        fill="none"
        stroke="#78A083"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function ProgressChart() {
  return (
    <g>
      <rect
        x="76"
        y="123"
        width="18"
        height="28"
        rx="4"
        fill="#F6C8B2"
        stroke="#C65A3A"
        strokeWidth="3"
      />
      <rect
        x="105"
        y="111"
        width="18"
        height="40"
        rx="4"
        fill="#E07A5F"
        stroke="#C65A3A"
        strokeWidth="3"
      />
      <rect
        x="134"
        y="96"
        width="18"
        height="55"
        rx="4"
        fill="#78A083"
        stroke="#4F7D68"
        strokeWidth="3"
      />
      <path
        d="M81 105c12-9.8 22.8-12 32.5-6.4 11 6.4 23.7 2.3 38-12.4"
        fill="none"
        stroke="#2E1F1A"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}

function RestMarks() {
  return (
    <g fill="#C65A3A" fontFamily="var(--font-heading)" fontWeight="700">
      <text x="173" y="57" fontSize="22">
        Z
      </text>
      <text x="191" y="42" fontSize="15">
        z
      </text>
    </g>
  );
}

function GreetingBubble() {
  return (
    <g>
      <path
        d="M164 39h28c8 0 14.5 5.8 14.5 13s-6.5 13-14.5 13h-7.5l-9.6 9.1V65H164c-8 0-14.5-5.8-14.5-13S156 39 164 39Z"
        fill="#FFFDF9"
        stroke="#E07A5F"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <text
        x="164"
        y="56.5"
        fill="#C65A3A"
        fontFamily="var(--font-heading)"
        fontSize="15"
        fontWeight="700"
      >
        Hi
      </text>
    </g>
  );
}

function Sparkles() {
  return (
    <g
      fill="none"
      stroke="#E07A5F"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.8"
    >
      <path d="M31 118h9M35.5 113.5v9" />
      <path d="M204 117h9M208.5 112.5v9" />
      <path d="M183 27h7M186.5 23.5v7" />
    </g>
  );
}
