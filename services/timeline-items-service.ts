import { supabase } from "@/lib/supabase";
import { generateDefaultTimelineItems } from "@/lib/utils";
import { TableName } from "@/models/enums/table-name";

export const createDefaultTimelineItems = async (
  projectId: string,
): Promise<void> => {
  const timelineItems = await generateDefaultTimelineItems(projectId);
  await supabase.from(TableName.TimelineItem).insert(timelineItems);
};
