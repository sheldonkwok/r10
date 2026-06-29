export function MStatusBar() {
  return (
    <div
      className="font-pixel"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 80,
        fontSize: 10,
        color: "var(--color-paper)",
        letterSpacing: 1,
      }}
    >
      <div>9:41</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ fontSize: 8 }}>▮▮▮</span>
        <span style={{ fontSize: 8 }}>≋</span>
        <span style={{ fontSize: 8 }}>96%</span>
      </div>
    </div>
  );
}

export function MHomeBar() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        width: 130,
        height: 5,
        background: "var(--color-paper)",
        opacity: 0.5,
        zIndex: 95,
      }}
    />
  );
}
