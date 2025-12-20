import { SpaceType } from '../../types';

interface PlaceholderSpaceProps {
  type: SpaceType;
  title: string;
}

export function PlaceholderSpace({ type, title }: PlaceholderSpaceProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-default-400 p-8">
      <h4 className="text-xl font-bold mb-2">
        {title}
      </h4>
      <p className="text-small">
        Coming soon - {type} editor is under development
      </p>
    </div>
  );
}
