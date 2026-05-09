export function Currency({ amount }: { amount: number }) {
  const isNegative = amount < 0;
  const isPositive = amount > 0;
  
  return (
    <span className={
      isNegative ? "text-destructive" : isPositive ? "text-success" : "text-foreground"
    }>
      {isNegative ? "-" : ""}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function formatCurrency(amount: number) {
  return `$${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
