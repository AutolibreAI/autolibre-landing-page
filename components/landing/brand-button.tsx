import { cloneElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
type BrandButtonProps = {
  readonly showArrow?: boolean;
} & Omit<ComponentProps<typeof Button>, "variant">;
export default function BrandButton({ className = "", showArrow = true, children, ...props }: BrandButtonProps) {
  const shouldUseAsChild: boolean = props.asChild === true;
  const iconNode: ReactNode = showArrow ? <ArrowRight size={16} aria-hidden /> : null;
  if (shouldUseAsChild && isValidElement(children)) {
    const childElement: ReactElement<{ children?: ReactNode }> = children as ReactElement<{ children?: ReactNode }>;
    const childWithIcon: ReactElement = cloneElement(childElement, undefined, (
      <>
        <span>{childElement.props.children}</span>
        {iconNode}
      </>
    ));
    return (
      <Button className={`al-button ${className}`.trim()} {...props}>
        {childWithIcon}
      </Button>
    );
  }
  return (
    <Button className={`al-button ${className}`.trim()} {...props}>
      <span>{children}</span>
      {iconNode}
    </Button>
  );
}
