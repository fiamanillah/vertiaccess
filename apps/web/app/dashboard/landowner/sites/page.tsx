import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>My Sites</CardTitle>
            <CardDescription>
              Placeholder page for My Sites management and details.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/landowner/sites/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Site
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
        </CardContent>
      </Card>
    </div>
  )
}
