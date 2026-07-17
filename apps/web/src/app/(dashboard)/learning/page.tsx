import { LEARNING_TOPICS } from "@vittamhub/types";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@vittamhub/ui";

export default function LearningPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Learning</h1>
        <p className="text-sm text-text-secondary">Structured, practical topics for founders at every stage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING_TOPICS.map((topic) => (
          <Card key={topic.slug} className="flex flex-col gap-3">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-0">
              <CardTitle>{topic.label}</CardTitle>
              <Badge variant="brand">Coming soon</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">{topic.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
