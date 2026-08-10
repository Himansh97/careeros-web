import { ResumeBullet } from "@/components/resume/resume-bullet";
import type { ResumeSection as ResumeSectionType } from "@/types/resume";

interface ResumeSectionProps {
  section: ResumeSectionType;
  mode: "tailored" | "original" | "side-by-side";
  onSaveBullet?: (claimId: string, text: string) => Promise<string[]>;
  onRevertBullet?: (claimId: string) => Promise<void>;
}

export function ResumeSection({
  section,
  mode,
  onSaveBullet,
  onRevertBullet,
}: ResumeSectionProps) {
  return (
    <div>
      <div className="mb-1.5">
        <h3 className="text-sm font-medium text-foreground">{section.heading}</h3>
        {section.subheading && (
          <p className="text-xs text-muted-foreground">{section.subheading}</p>
        )}
      </div>
      <ul className="space-y-1">
        {section.bullets.map((bullet) => (
          <ResumeBullet
            key={bullet.id}
            bullet={bullet}
            mode={mode}
            onSave={onSaveBullet}
            onRevert={onRevertBullet}
          />
        ))}
      </ul>
    </div>
  );
}
