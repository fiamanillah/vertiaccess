import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Operator Dashboard</CardTitle>
          <CardDescription>
            Placeholder page for Operator Dashboard management and details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </CardContent>
      </Card>
    </div>
  )
}
