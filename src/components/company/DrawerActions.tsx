import Button from "../ui/Button";

export default function DrawerActions({
  companyName,
  saving,
  saveError,
  onDelete,
  onSaveAndClose,
}: {
  companyName: string;
  saving: boolean;
  saveError: string | null;
  onDelete: () => void;
  onSaveAndClose: () => void;
}) {
  return (
    <>
      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-white/10">
        <Button
          variant="danger"
          onClick={() => {
            if (confirm(`Remove ${companyName} from your list?`)) onDelete();
          }}
        >
          Delete company
        </Button>
        <Button onClick={onSaveAndClose} disabled={saving}>
          {saving ? "Saving…" : "Save & close"}
        </Button>
      </div>
    </>
  );
}
