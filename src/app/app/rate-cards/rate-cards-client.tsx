"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";

type Manpower = { id: string; designation: string; experience: string; grade: string | null; location: string | null; monthlyRate: number; dailyRate: number; hourlyRate: number; currency: string };
type NonManpower = { id: string; category: string; description: string; unit: string; unitCost: number; tax: number; marginPct: number; currency: string };
type License = { id: string; product: string; edition: string | null; licenseType: string; duration: string; cost: number; marginPct: number; currency: string };

export function RateCardsClient({
  manpower,
  nonManpower,
  license,
}: {
  manpower: Manpower[];
  nonManpower: NonManpower[];
  license: License[];
}) {
  const [mp, setMp] = useState(manpower);
  const [nmp, setNmp] = useState(nonManpower);
  const [lic, setLic] = useState(license);
  const [openType, setOpenType] = useState<null | "MP" | "NMP" | "LIC">(null);

  async function addManpower(form: FormData) {
    const res = await fetch("/api/rate-cards/manpower", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Failed");
    setMp((p) => [data.card, ...p]);
    toast.success("Rate card added");
    setOpenType(null);
  }
  async function addNonManpower(form: FormData) {
    const res = await fetch("/api/rate-cards/non-manpower", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Failed");
    setNmp((p) => [data.card, ...p]);
    toast.success("Rate card added");
    setOpenType(null);
  }
  async function addLicense(form: FormData) {
    const res = await fetch("/api/rate-cards/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error ?? "Failed");
    setLic((p) => [data.card, ...p]);
    toast.success("Rate card added");
    setOpenType(null);
  }

  async function remove(kind: "MP" | "NMP" | "LIC", id: string) {
    const endpoint =
      kind === "MP" ? "manpower" : kind === "NMP" ? "non-manpower" : "license";
    const res = await fetch(`/api/rate-cards/${endpoint}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return toast.error("Failed");
    if (kind === "MP") setMp((p) => p.filter((c) => c.id !== id));
    if (kind === "NMP") setNmp((p) => p.filter((c) => c.id !== id));
    if (kind === "LIC") setLic((p) => p.filter((c) => c.id !== id));
  }

  return (
    <>
      <Tabs defaultValue="mp">
        <TabsList>
          <TabsTrigger value="mp">Manpower</TabsTrigger>
          <TabsTrigger value="nmp">Non-Manpower</TabsTrigger>
          <TabsTrigger value="lic">License</TabsTrigger>
        </TabsList>

        <TabsContent value="mp">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Manpower rate card</CardTitle>
              <Button size="sm" variant="gradient" onClick={() => setOpenType("MP")}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {mp.length === 0 ? (
                <EmptyState title="No manpower rates" description="Add rates by designation and experience." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Designation</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Hourly</TableHead>
                      <TableHead className="text-right">Daily</TableHead>
                      <TableHead className="text-right">Monthly</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mp.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.designation}</TableCell>
                        <TableCell>{c.experience} yrs</TableCell>
                        <TableCell>{c.grade ?? "—"}</TableCell>
                        <TableCell>{c.location ?? "—"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(c.hourlyRate), c.currency)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(c.dailyRate), c.currency)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(Number(c.monthlyRate), c.currency)}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => remove("MP", c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nmp">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Non-manpower rate card</CardTitle>
              <Button size="sm" variant="gradient" onClick={() => setOpenType("NMP")}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {nmp.length === 0 ? (
                <EmptyState title="No non-manpower rates" description="Add travel, cloud, training, consulting categories." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Unit cost</TableHead>
                      <TableHead className="text-right">Tax %</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nmp.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell>{c.description}</TableCell>
                        <TableCell>{c.unit}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(c.unitCost), c.currency)}</TableCell>
                        <TableCell className="text-right">{Number(c.tax)}%</TableCell>
                        <TableCell className="text-right">{Number(c.marginPct)}%</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => remove("NMP", c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lic">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>License rate card</CardTitle>
              <Button size="sm" variant="gradient" onClick={() => setOpenType("LIC")}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {lic.length === 0 ? (
                <EmptyState title="No license rates" description="Add Microsoft, Salesforce, Jira, Power BI, SAP, etc." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Edition</TableHead>
                      <TableHead>License type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lic.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.product}</TableCell>
                        <TableCell>{c.edition ?? "—"}</TableCell>
                        <TableCell>{c.licenseType}</TableCell>
                        <TableCell>{c.duration}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(c.cost), c.currency)}</TableCell>
                        <TableCell className="text-right">{Number(c.marginPct)}%</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => remove("LIC", c.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openType === "MP"} onOpenChange={(v) => !v && setOpenType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New manpower rate</DialogTitle>
            <DialogDescription>Add rates by designation, experience and location.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addManpower(new FormData(e.currentTarget));
            }}
            className="grid grid-cols-2 gap-3"
          >
            <Field name="designation" label="Designation" required />
            <Field name="experience" label="Experience (e.g. 3-5)" required />
            <Field name="grade" label="Grade" />
            <Field name="location" label="Location" />
            <Field name="hourlyRate" label="Hourly rate" type="number" required />
            <Field name="dailyRate" label="Daily rate" type="number" required />
            <Field name="monthlyRate" label="Monthly rate" type="number" required />
            <Field name="currency" label="Currency" defaultValue="INR" />
            <DialogFooter className="col-span-2">
              <Button variant="gradient" type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openType === "NMP"} onOpenChange={(v) => !v && setOpenType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New non-manpower rate</DialogTitle>
            <DialogDescription>Travel, infra, cloud, training, consulting — anything other than manpower or licenses.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addNonManpower(new FormData(e.currentTarget));
            }}
            className="grid grid-cols-2 gap-3"
          >
            <Field name="category" label="Category" required />
            <Field name="description" label="Description" required />
            <Field name="unit" label="Unit (per trip / hr / GB)" required />
            <Field name="unitCost" label="Unit cost" type="number" required />
            <Field name="tax" label="Tax %" type="number" defaultValue="18" />
            <Field name="marginPct" label="Margin %" type="number" defaultValue="20" />
            <DialogFooter className="col-span-2">
              <Button variant="gradient" type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openType === "LIC"} onOpenChange={(v) => !v && setOpenType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New license rate</DialogTitle>
            <DialogDescription>Microsoft, Salesforce, Jira, Power BI, SAP …</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addLicense(new FormData(e.currentTarget));
            }}
            className="grid grid-cols-2 gap-3"
          >
            <Field name="product" label="Product" required />
            <Field name="edition" label="Edition" />
            <Field name="licenseType" label="License type" required />
            <Field name="duration" label="Duration" required />
            <Field name="cost" label="Cost" type="number" required />
            <Field name="marginPct" label="Margin %" type="number" defaultValue="15" />
            <DialogFooter className="col-span-2">
              <Button variant="gradient" type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} className="mt-1.5" />
    </div>
  );
}
