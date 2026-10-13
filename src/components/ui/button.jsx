export function Button({ className = "", variant = "outline", children, ...props }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}
