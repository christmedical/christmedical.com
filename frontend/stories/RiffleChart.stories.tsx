import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { RiffleChart, type RiffleChartState } from "@/components/RiffleChart";

const sample = {
  patientName: "Maria Santos",
  room: "Ward B · 12",
  status: "Awaiting physician",
};

const meta = {
  title: "Christ Medical/RiffleChart",
  component: RiffleChart,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Bronze ‘rifle file’ patient chart control with closed, peek, and expanded states. **Door slot** highlights when the chart is ready for the doctor. Tab control uses a **44px minimum** hit target for touch.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["closed", "peek", "expanded"],
    },
    doorSlot: { control: "boolean" },
  },
  args: {
    ...sample,
    doorSlot: false,
    defaultState: "closed" as const,
  },
} satisfies Meta<typeof RiffleChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    state: "closed",
    doorSlot: false,
  },
};

export const Peek: Story = {
  args: {
    state: "peek",
    doorSlot: false,
  },
};

export const Expanded: Story = {
  args: {
    state: "expanded",
    doorSlot: false,
  },
  render: (args) => (
    <RiffleChart
      {...args}
      state={args.state}
      doorSlot={args.doorSlot}
    >
      <p>
        Today: mild improvement in mobility. Continue current meds. Follow-up
        labs ordered.
      </p>
    </RiffleChart>
  ),
};

export const DoorSlotPeek: Story = {
  name: "Door slot (peek)",
  args: {
    state: "peek",
    doorSlot: true,
  },
};

export const DoorSlotExpanded: Story = {
  name: "Door slot (expanded)",
  args: {
    state: "expanded",
    doorSlot: true,
  },
  render: (args) => (
    <RiffleChart
      {...args}
      state={args.state}
      doorSlot={args.doorSlot}
    >
      <p>Physician review complete — ready for discharge planning.</p>
    </RiffleChart>
  ),
};

/** All static states plus door-slot variant in one view (touch-friendly spacing). */
export const Overview: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-screen bg-ancient-vellum p-6 text-bronze-deep">
      <h1 className="mb-6 text-lg font-semibold tracking-tight">
        RiffleChart — Sanctified Bronze
      </h1>
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-bronze-deep/70">
            States
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap">
            <RiffleChart {...sample} state="closed" />
            <RiffleChart {...sample} state="peek" />
            <RiffleChart {...sample} state="expanded">
              <p className="text-bronze-deep/85">
                Expanded body: notes, vitals, and orders.
              </p>
            </RiffleChart>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-bronze-deep/70">
            Door slot (ready for doctor)
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:flex-wrap">
            <RiffleChart {...sample} state="peek" doorSlot />
            <RiffleChart {...sample} state="expanded" doorSlot>
              <p>Glowing border indicates the chart is in the door slot.</p>
            </RiffleChart>
          </div>
        </section>
      </div>
    </div>
  ),
};

/** Tap the tab to cycle closed → peek → expanded (44px+ hit area). */
export const Interactive: Story = {
  render: function InteractiveRender() {
    const [state, setState] = useState<RiffleChartState>("closed");
    return (
      <div className="space-y-4 bg-ancient-vellum p-4">
        <p className="text-sm text-bronze-deep">
          Current: <strong>{state}</strong> — tap the bronze tab to cycle.
        </p>
        <RiffleChart
          {...sample}
          state={state}
          onStateChange={setState}
          doorSlot={state !== "closed"}
        >
          <p>Expanded content after three taps from closed.</p>
        </RiffleChart>
      </div>
    );
  },
};

export const Playground: Story = {
  args: {
    state: "peek",
    doorSlot: false,
  },
};
