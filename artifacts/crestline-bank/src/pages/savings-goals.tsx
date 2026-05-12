import { useState } from "react";
import {
  useGetSavingsGoals,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
  getGetSavingsGoalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Plus,
  Trash2,
  PiggyBank,
  Car,
  Plane,
  Home,
  GraduationCap,
  Heart,
  ShoppingBag,
  TrendingUp,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ICONS = [
  { key: "target", Icon: Target, label: "Goal" },
  { key: "piggybank", Icon: PiggyBank, label: "Savings" },
  { key: "car", Icon: Car, label: "Car" },
  { key: "plane", Icon: Plane, label: "Travel" },
  { key: "home", Icon: Home, label: "Home" },
  { key: "education", Icon: GraduationCap, label: "Education" },
  { key: "health", Icon: Heart, label: "Health" },
  { key: "shopping", Icon: ShoppingBag, label: "Shopping" },
  { key: "investment", Icon: TrendingUp, label: "Invest" },
];

const COLORS = [
  "#1A5C38", "#16a34a", "#dc2626", "#d97706",
  "#7c3aed", "#0891b2", "#db2777", "#65a30d",
];

function getIcon(key: string) {
  return ICONS.find(i => i.key === key)?.Icon ?? Target;
}

function AddFundsModal({ goalId, goalName, onClose }: { goalId: number; goalName: string; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { mutate, isPending } = useUpdateSavingsGoal({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetSavingsGoalsQueryKey() });
        toast({ title: "Funds added!", description: `Added $${amount} to ${goalName}` });
        onClose();
      },
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Add Funds to {goalName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Amount to add</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <Input
                className="pl-7"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                step="0.01"
                min="0.01"
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={isPending || !amount || Number(amount) <= 0}
              onClick={() => mutate({ goalId, data: { addAmount: Number(amount) } })}
              className="flex-1 bg-[#1A5C38] hover:bg-[#155E36] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {isPending ? "Adding..." : "Add Funds"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateGoalModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(COLORS[0]!);
  const [icon, setIcon] = useState("target");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutate, isPending } = useCreateSavingsGoal({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetSavingsGoalsQueryKey() });
        toast({ title: "Goal created!", description: `${name} goal has been created.` });
        onClose();
      },
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Create Savings Goal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Goal Name</Label>
            <Input placeholder="e.g. Vacation Fund, New Car..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Target Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <Input className="pl-7" placeholder="0.00" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} type="number" min="1" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Target Date (optional)</Label>
            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(({ key, Icon }) => (
                <button key={key} type="button" onClick={() => setIcon(key)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${icon === key ? "ring-2 ring-[#1A5C38] bg-blue-50" : "bg-gray-100 hover:bg-gray-200"}`}>
                  <Icon className="w-4 h-4 text-gray-600" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              disabled={isPending || !name || !targetAmount}
              onClick={() => mutate({ data: { name, targetAmount: Number(targetAmount), targetDate: targetDate || undefined, color, icon } })}
              className="flex-1 bg-[#1A5C38] hover:bg-[#155E36] disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {isPending ? "Creating..." : "Create Goal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavingsGoals() {
  const { data: goals, isLoading } = useGetSavingsGoals();
  const { mutate: deleteGoal } = useDeleteSavingsGoal();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<{ id: number; name: string } | null>(null);

  const totalSaved = goals?.reduce((s, g) => s + g.currentAmount, 0) ?? 0;
  const totalTarget = goals?.reduce((s, g) => s + g.targetAmount, 0) ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary" data-testid="text-page-title">Savings Goals</h1>
          <p className="text-sm text-gray-400 mt-1">Track your progress toward financial milestones.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#1A5C38] hover:bg-[#155E36] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {/* Summary */}
      {!isLoading && goals && goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total Saved</p>
            <p className="text-xl font-bold text-[#1A5C38]">${totalSaved.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Total Target</p>
            <p className="text-xl font-bold text-gray-900">${totalTarget.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Active Goals</p>
            <p className="text-xl font-bold text-gray-900">{goals.length}</p>
          </div>
        </div>
      )}

      {/* Goals grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map(goal => {
            const Icon = getIcon(goal.icon);
            const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            return (
              <Card key={goal.id} className="shadow-sm border-border bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}20` }}>
                        <Icon className="w-5 h-5" style={{ color: goal.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{goal.name}</p>
                        {goal.targetDate && (
                          <p className="text-xs text-gray-400 mt-0.5">Target: {new Date(goal.targetDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        deleteGoal({ goalId: goal.id }, {
                          onSuccess: () => {
                            void queryClient.invalidateQueries({ queryKey: getGetSavingsGoalsQueryKey() });
                            toast({ title: "Goal deleted" });
                          },
                        });
                      }}
                      className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-gray-900">
                        ${goal.currentAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm text-gray-400">
                        of ${goal.targetAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-xs text-gray-400">{pct.toFixed(0)}% complete</span>
                      {remaining > 0 ? (
                        <span className="text-xs text-gray-400">${remaining.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to go</span>
                      ) : (
                        <span className="text-xs font-semibold text-green-600">Goal reached!</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setAddFundsGoal({ id: goal.id, name: goal.name })}
                    className="w-full py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    + Add Funds
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="font-semibold text-gray-700 mb-1">No savings goals yet</h3>
          <p className="text-sm text-gray-400 mb-6">Create your first goal to start tracking your progress.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-[#1A5C38] hover:bg-[#155E36] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Create Your First Goal
          </button>
        </div>
      )}

      {showCreate && <CreateGoalModal onClose={() => setShowCreate(false)} />}
      {addFundsGoal && <AddFundsModal goalId={addFundsGoal.id} goalName={addFundsGoal.name} onClose={() => setAddFundsGoal(null)} />}
    </div>
  );
}
