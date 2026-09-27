import { c } from "./theme";

// Close-up phone: top of the device is visible, the rest runs off the bottom of the frame
export const Phone: React.FC<{ children: React.ReactNode; top?: number }> = ({
  children,
  top = 420,
}) => (
  <div
    style={{
      position: "absolute",
      left: 150,
      top,
      width: 780,
      height: 1600,
      borderRadius: 110,
      backgroundColor: "#1C1C1E",
      padding: 24,
      boxShadow: "0 40px 120px rgba(0,0,0,.55)",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 88,
        overflow: "hidden",
        position: "relative",
        background: "linear-gradient(160deg, #1E3A8A 0%, #0F172A 70%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 26,
          left: "50%",
          translate: "-50% 0px",
          width: 200,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#000",
          zIndex: 5,
        }}
      />
      {children}
    </div>
  </div>
);

export const BankNotification: React.FC = () => (
  <div
    style={{
      margin: "0 36px",
      backgroundColor: "rgba(245,245,247,0.94)",
      borderRadius: 44,
      padding: "32px 36px",
      display: "flex",
      gap: 28,
      alignItems: "flex-start",
      boxShadow: "0 20px 60px rgba(0,0,0,.35)",
    }}
  >
    <div
      style={{
        width: 96,
        height: 96,
        minWidth: 96,
        borderRadius: 24,
        backgroundColor: c.money,
        color: c.white,
        fontSize: 56,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      zł
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#6B7280", fontWeight: 600 }}>
        <span>BANK</span>
        <span>teraz</span>
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, color: "#111827", marginTop: 6 }}>
        Przelew przychodzący
      </div>
      <div style={{ fontSize: 68, fontWeight: 800, color: c.money, marginTop: 4, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
        +8 500,00 zł
      </div>
      <div style={{ fontSize: 30, fontWeight: 500, color: "#4B5563", marginTop: 6 }}>
        Tytuł: dotacja – mikroretencja
      </div>
    </div>
  </div>
);
