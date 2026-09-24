"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ERSBadge, ERSDot } from "@/components/ui/ERSBadge";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Toaster } from "@/components/ui/Toast";
import { useState } from "react";

export default function DevComponentsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-white p-8">
      <Toaster />
      
      <header className="mb-12">
        <h1 className="font-display text-display-xl text-brand-black mb-4">COMPONENT LIBRARY</h1>
        <p className="font-body text-body-lg text-brand-black/70">Brutalist UI components for AnnaSetu</p>
      </header>

      <section className="mb-16">
        <h2 className="font-display text-display-md text-brand-black mb-8">BUTTONS</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">PRIMARY</Button>
          <Button variant="secondary">SECONDARY</Button>
          <Button variant="ghost">GHOST</Button>
          <Button variant="destructive">DESTRUCTIVE</Button>
          <Button variant="primary" size="sm">SMALL</Button>
          <Button variant="primary" size="lg">LARGE</Button>
          <Button variant="primary" loading>LOADING</Button>
          <Button variant="primary" disabled>DISABLED</Button>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-display-md text-brand-black mb-8">CARDS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <h3 className="font-display text-display-sm text-brand-black">Default Card</h3>
            </CardHeader>
            <CardContent>
              <p className="font-body text-body-md text-brand-black">This is a default brutalist card with hard borders and shadows.</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm">ACTION</Button>
              <Button variant="primary" size="sm">PRIMARY</Button>
            </CardFooter>
          </Card>
          
          <Card variant="elevated">
            <CardHeader>
              <h3 className="font-display text-display-sm text-brand-black">Elevated Card</h3>
            </CardHeader>
            <CardContent>
              <p className="font-body text-body-md text-brand-black">Elevated variant with larger shadow for modals and important content.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-display-md text-brand-black mb-8">BADGES</h2>
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <Badge variant="safe">SAFE</Badge>
          <Badge variant="caution">CAUTION</Badge>
          <Badge variant="warning">WARNING</Badge>
          <Badge variant="critical">CRITICAL</Badge>
          <Badge variant="emergency">EMERGENCY</Badge>
          <Badge variant="default">DEFAULT</Badge>
        </div>
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <Badge variant="safe" size="sm">SMALL</Badge>
          <Badge variant="caution" size="md">MEDIUM</Badge>
          <Badge variant="warning" size="lg">LARGE</Badge>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Badge variant="critical" pulse>PULSING CRITICAL</Badge>
          <Badge variant="emergency" pulse>PULSING EMERGENCY</Badge>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-display-md text-brand-black mb-8">ERSBADGE</h2>
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <ERSBadge score={15} />
          <ERSBadge score={45} />
          <ERSBadge score={65} />
          <ERSBadge score={85} />
          <ERSBadge score={97} />
        </div>
        <div className="flex flex-wrap gap-4 items-center mb-8">
          <ERSBadge score={15} size="sm" />
          <ERSBadge score={45} size="md" />
          <ERSBadge score={85} size="lg" />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <ERSDot score={15} size="lg" />
            <span className="font-body text-body-sm">ERS 15</span>
          </div>
          <div className="flex items-center gap-2">
            <ERSDot score={85} size="lg" />
            <span className="font-body text-body-sm">ERS 85</span>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-display-md text-brand-black mb-8">INPUTS</h2>
        <div className="max-w-md space-y-6">
          <Input 
            label="Food Name" 
            placeholder="e.g., Biryani" 
            hint="Enter the name of the food item"
          />
          <Input 
            label="Quantity (kg)" 
            type="number" 
            step="0.1"
            placeholder="20"
            error="Quantity must be greater than 0"
          />
          <Input 
            label="Expiry Time" 
            type="datetime-local"
          />
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-display-md text-brand-black mb-8">MODALS</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => setModalOpen(true)}>OPEN MODAL</Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>OPEN CONFIRM MODAL</Button>
        </div>
        
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Listing Confirmation"
          description="Please review the details before confirming your listing."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>CANCEL</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>CONFIRM</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label-text text-brand-black">Food Item</label>
              <p className="font-body text-body-md text-brand-black">Biryani × 20 servings</p>
            </div>
            <div>
              <label className="label-text text-brand-black">Expiry</label>
              <p className="font-body text-body-md text-brand-black">Today, 8:00 PM (2 hours remaining)</p>
            </div>
            <div>
              <label className="label-text text-brand-black">ERS Score</label>
              <ERSBadge score={84} />
            </div>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setConfirmOpen(false)}
          title="Delete Listing"
          message="Are you sure you want to delete this listing? This action cannot be undone."
          confirmText="DELETE"
          cancelText="KEEP"
          variant="destructive"
        />
      </section>

      <section className="mb-16">
        <h2 className="font-display text-display-md text-brand-black mb-8">TOASTS (Click to test)</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => 
            import("@/components/ui/Toast").then(({ toast }) => 
              toast.success({ title: "Success!", description: "Listing created successfully." })
            )
          }>SUCCESS TOAST</Button>
          <Button variant="secondary" onClick={() => 
            import("@/components/ui/Toast").then(({ toast }) => 
              toast.error({ title: "Error!", description: "Failed to create listing." })
            )
          }>ERROR TOAST</Button>
          <Button variant="ghost" onClick={() => 
            import("@/components/ui/Toast").then(({ toast }) => 
              toast.warning({ title: "Warning", description: "Low CV confidence - please verify." })
            )
          }>WARNING TOAST</Button>
        </div>
      </section>
    </div>
  );
}