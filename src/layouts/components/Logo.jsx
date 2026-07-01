import newlogo from "../../assets/new logo.png";

export function Logo({ compact = false }) {
  return (
    <div
      className={`eyeoty-logo ${
        compact ? "eyeoty-logo--compact" : "eyeoty-logo--expanded"
      }`}
    >
      <img
        src={newlogo}
        alt="EyeOTY Logo"
        className={`eyeoty-logo__image ${
          compact
            ? "eyeoty-logo__image--compact"
            : "eyeoty-logo__image--expanded"
        }`}
      />
    </div>
  );
}

export default Logo;