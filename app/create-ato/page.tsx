import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateAtoPage() {
  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-3">
        <Badge variant="outline">ATO Builder</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Make your own ATO /.../
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your own ATO by defining the slash route, personality, and
            capabilities you want to launch inside Brooks AI HUB.
          </p>
        </div>
      </header>

      <form className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ATO basics</CardTitle>
            <CardDescription>
              Share the name and slash route users will type to reach your ATO.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-name">ATO name</Label>
              <Input
                id="ato-name"
                name="ato-name"
                placeholder="Example: My Wellness ATO"
                type="text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-route">Slash route</Label>
              <Input
                id="ato-route"
                name="ato-route"
                placeholder="/MyWellnessATO/"
                type="text"
              />
              <p className="text-xs text-muted-foreground">
                Use PascalCase or camelCase so it matches existing ATO routes.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-tagline">One-line purpose</Label>
              <Input
                id="ato-tagline"
                name="ato-tagline"
                placeholder="A mindful daily companion for routines and habits."
                type="text"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personality + behavior</CardTitle>
            <CardDescription>
              Describe the tone, boundaries, and how the ATO should communicate.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-tone">Tone & voice</Label>
              <Input
                id="ato-tone"
                name="ato-tone"
                placeholder="Supportive, energetic, and concise."
                type="text"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-boundaries">Safety boundaries</Label>
              <Textarea
                id="ato-boundaries"
                name="ato-boundaries"
                placeholder="List topics to avoid, escalation rules, or compliance needs."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-intro">Welcome message</Label>
              <Textarea
                id="ato-intro"
                name="ato-intro"
                placeholder="Hey there! I'm your wellness ATO — tell me what you want to improve today."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capabilities</CardTitle>
            <CardDescription>
              Select what your ATO can access and how it handles memory.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ato-tools">Preferred tools</Label>
              <Textarea
                id="ato-tools"
                name="ato-tools"
                placeholder="Example: Calendar reminders, travel routing, weather summaries."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-memory">Memory preference</Label>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <label className="flex items-start gap-2">
                  <input
                    className="mt-1 h-4 w-4 accent-foreground"
                    name="ato-memory"
                    type="radio"
                    value="opt-in"
                  />
                  <span>Opt-in memory only (ask before saving).</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    className="mt-1 h-4 w-4 accent-foreground"
                    name="ato-memory"
                    type="radio"
                    value="always"
                  />
                  <span>Always save memory when useful.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    className="mt-1 h-4 w-4 accent-foreground"
                    name="ato-memory"
                    type="radio"
                    value="never"
                  />
                  <span>Never store memory.</span>
                </label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ato-audience">Target audience</Label>
              <Input
                id="ato-audience"
                name="ato-audience"
                placeholder="Example: Teens and adults looking for routine coaching."
                type="text"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Launch checklist</CardTitle>
            <CardDescription>
              Double-check the details so the team can build your ATO fast.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <label className="flex items-start gap-2">
              <input
                className="mt-1 h-4 w-4 accent-foreground"
                name="ato-review"
                type="checkbox"
              />
              <span>I verified the slash route is unique.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                className="mt-1 h-4 w-4 accent-foreground"
                name="ato-review"
                type="checkbox"
              />
              <span>I listed tools or integrations needed.</span>
            </label>
            <label className="flex items-start gap-2">
              <input
                className="mt-1 h-4 w-4 accent-foreground"
                name="ato-review"
                type="checkbox"
              />
              <span>I defined how memory should be handled.</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Submissions are reviewed by the Brooks AI HUB team before launch.
          </p>
          <Button type="submit" variant="outline">
            Submit ATO request
          </Button>
        </div>
      </form>
    </div>
  );
}
