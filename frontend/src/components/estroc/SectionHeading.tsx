import { MaskLines, Rise } from "./MaskReveal";

interface SectionHeadingProps {
  title: string;
  copy: string;
}

/**
 * The heading / copy pair every section opens with.
 *
 * This lived inline in three files and had already started to drift, so the
 * type scale now has exactly one home — change it here and every section moves
 * together.
 */
export default function SectionHeading({ title, copy }: SectionHeadingProps) {
  const id = title.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="max-w-3xl" data-testid={`${id}-heading-block`}>
      <MaskLines
        as="h2"
        lines={[title]}
        className="text-5xl font-semibold tracking-[-0.065em] text-zinc-100 sm:text-7xl"
        testId={`${id}-heading`}
      />
      <Rise delay={0.12}>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-500 sm:text-xl" data-testid={`${id}-copy`}>
          {copy}
        </p>
      </Rise>
    </div>
  );
}
