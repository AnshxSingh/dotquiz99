export function Header() {
  return (
    <div className="text-center mb-10 p-8 bg-card rounded-2xl shadow-sm border border-border/50">
      <h1 className="text-3xl font-bold mb-3 text-foreground">📚 Quiz Master</h1>
      <p className="text-muted-foreground text-base">
        Upload your JSON quiz file or paste JSON text to start
      </p>
    </div>
  );
}
