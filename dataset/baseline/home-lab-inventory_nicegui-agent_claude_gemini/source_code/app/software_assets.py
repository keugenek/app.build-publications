from nicegui import ui
from app.services import SoftwareAssetService, HardwareAssetService, IPAllocationService
from app.models import SoftwareAssetCreate, SoftwareAssetUpdate, SoftwareType, AssetStatus
import logging

logger = logging.getLogger(__name__)


def create_asset_form(asset=None, on_save=None, on_cancel=None):
    """Create form for adding/editing software assets"""

    # Get hardware hosts for dropdown
    hardware_assets = HardwareAssetService.get_all()
    host_options = {"none": "No Hardware Host"}
    for h in hardware_assets:
        if h.id is not None:
            host_options[str(h.id)] = f"{h.name} ({h.type.value})"

    # Initialize form data
    name_input = ui.input(
        label="Asset Name", value=asset.name if asset else "", placeholder="e.g., Web-Server-VM, Docker-Registry"
    ).classes("w-full")

    type_select = ui.select(
        options={t.value: t.value.replace("_", " ").title() for t in SoftwareType},
        label="Software Type",
        value=asset.type.value if asset else SoftwareType.VM.value,
    ).classes("w-full")

    status_select = ui.select(
        options={s.value: s.value.replace("_", " ").title() for s in AssetStatus},
        label="Status",
        value=asset.status.value if asset else AssetStatus.ACTIVE.value,
    ).classes("w-full")

    version_input = ui.input(
        label="Version", value=asset.version if asset and asset.version else "", placeholder="e.g., 1.0.0, Ubuntu 22.04"
    ).classes("w-full")

    host_select = ui.select(
        options=host_options,
        label="Hardware Host",
        value=str(asset.hardware_host_id) if asset and asset.hardware_host_id else "none",
    ).classes("w-full")

    # Resource allocation inputs
    cpu_input = ui.number(
        label="CPU Cores",
        value=asset.cpu_cores if asset and asset.cpu_cores else None,
        min=1,
        placeholder="Number of CPU cores",
    ).classes("w-full")

    memory_input = ui.number(
        label="Memory (GB)",
        value=asset.memory_gb if asset and asset.memory_gb else None,
        min=1,
        placeholder="Memory allocation in GB",
    ).classes("w-full")

    storage_input = ui.number(
        label="Storage (GB)",
        value=asset.storage_gb if asset and asset.storage_gb else None,
        min=1,
        placeholder="Storage allocation in GB",
    ).classes("w-full")

    notes_input = (
        ui.textarea(
            label="Notes",
            value=asset.notes if asset and asset.notes else "",
            placeholder="Additional notes or configuration details",
        )
        .classes("w-full")
        .props("rows=3")
    )

    def save_asset():
        try:
            if not name_input.value.strip():
                ui.notify("Asset name is required", type="negative")
                return

            asset_data = {
                "name": name_input.value.strip(),
                "type": SoftwareType(type_select.value),
                "status": AssetStatus(status_select.value),
                "version": version_input.value.strip() or None,
                "hardware_host_id": int(host_select.value)
                if host_select.value and host_select.value != "none"
                else None,
                "cpu_cores": int(cpu_input.value) if cpu_input.value else None,
                "memory_gb": int(memory_input.value) if memory_input.value else None,
                "storage_gb": int(storage_input.value) if storage_input.value else None,
                "notes": notes_input.value.strip() or None,
            }

            if asset is None:
                # Create new asset
                create_data = SoftwareAssetCreate(**asset_data)
                result = SoftwareAssetService.create(create_data)
                ui.notify(f'Software asset "{result.name}" created successfully', type="positive")
            else:
                # Update existing asset
                update_data = SoftwareAssetUpdate(**asset_data)
                result = SoftwareAssetService.update(asset.id, update_data)
                if result is None:
                    ui.notify("Asset not found", type="negative")
                    return
                ui.notify(f'Software asset "{result.name}" updated successfully', type="positive")

            if on_save:
                on_save()

        except Exception as e:
            logger.error(f"Error saving software asset: {e}")
            ui.notify(f"Error saving asset: {str(e)}", type="negative")

    return {
        "form_fields": [
            name_input,
            type_select,
            status_select,
            version_input,
            host_select,
            cpu_input,
            memory_input,
            storage_input,
            notes_input,
        ],
        "save_function": save_asset,
    }


@ui.refreshable
def software_assets_table():
    """Refreshable table of software assets"""
    try:
        assets = SoftwareAssetService.get_all()

        if not assets:
            with ui.card().classes("p-8 text-center"):
                ui.icon("memory", size="3em").classes("text-gray-400")
                ui.label("No software assets found").classes("text-xl text-gray-500 mt-4")
                ui.label('Click "Add Asset" to create your first software asset').classes("text-gray-400")
            return

        # Create table data
        columns = [
            {"name": "name", "label": "Name", "field": "name", "align": "left", "sortable": True},
            {"name": "type", "label": "Type", "field": "type", "align": "left", "sortable": True},
            {"name": "status", "label": "Status", "field": "status", "align": "center", "sortable": True},
            {"name": "version", "label": "Version", "field": "version", "align": "left"},
            {"name": "hardware_host", "label": "Host", "field": "hardware_host", "align": "left"},
            {"name": "resources", "label": "Resources", "field": "resources", "align": "left"},
            {"name": "actions", "label": "Actions", "field": "actions", "align": "center"},
        ]

        rows = []
        for asset in assets:
            # Format resources
            resources = []
            if asset.cpu_cores:
                resources.append(f"{asset.cpu_cores} CPU")
            if asset.memory_gb:
                resources.append(f"{asset.memory_gb}GB RAM")
            if asset.storage_gb:
                resources.append(f"{asset.storage_gb}GB Storage")

            rows.append(
                {
                    "id": asset.id,
                    "name": asset.name,
                    "type": asset.type.value.replace("_", " ").title(),
                    "status": asset.status.value.replace("_", " ").title(),
                    "version": asset.version or "-",
                    "hardware_host": asset.hardware_host.name if asset.hardware_host else "No Host",
                    "resources": ", ".join(resources) if resources else "-",
                }
            )

        table = ui.table(columns=columns, rows=rows).classes("w-full")
        table.add_slot(
            "body-cell-status",
            """
            <q-td key="status" :props="props">
                <q-badge :color="props.value === 'Active' ? 'positive' : 
                                props.value === 'Maintenance' ? 'warning' : 
                                props.value === 'Inactive' ? 'secondary' : 'negative'">
                    {{ props.value }}
                </q-badge>
            </q-td>
        """,
        )

        def handle_action(e):
            action = e.args["action"]
            asset_id = e.args["asset_id"]

            match action:
                case "view":
                    view_asset_details(asset_id)
                case "edit":
                    edit_asset(asset_id)
                case "delete":
                    delete_asset(asset_id)

        table.add_slot(
            "body-cell-actions",
            """
            <q-td key="actions" :props="props">
                <q-btn flat round icon="visibility" size="sm" 
                       @click="$parent.$emit('action', {action: 'view', asset_id: props.row.id})"
                       title="View Details">
                    <q-tooltip>View Details</q-tooltip>
                </q-btn>
                <q-btn flat round icon="edit" size="sm" color="primary"
                       @click="$parent.$emit('action', {action: 'edit', asset_id: props.row.id})"
                       title="Edit Asset">
                    <q-tooltip>Edit Asset</q-tooltip>
                </q-btn>
                <q-btn flat round icon="delete" size="sm" color="negative"
                       @click="$parent.$emit('action', {action: 'delete', asset_id: props.row.id})"
                       title="Delete Asset">
                    <q-tooltip>Delete Asset</q-tooltip>
                </q-btn>
            </q-td>
        """,
        )

        table.on("action", handle_action)

    except Exception as e:
        logger.error(f"Error loading software assets: {e}")
        ui.notify(f"Error loading software assets: {str(e)}", type="negative")


def view_asset_details(asset_id: int):
    """Show asset details in a dialog"""
    asset = SoftwareAssetService.get_by_id(asset_id)
    if asset is None:
        ui.notify("Asset not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        with ui.row().classes("items-center justify-between w-full mb-4"):
            ui.label(f"Asset Details: {asset.name}").classes("text-lg font-semibold")
            ui.button(icon="close", on_click=dialog.close).props("flat round")

        with ui.column().classes("gap-3 w-full"):
            ui.label(f"Type: {asset.type.value.replace('_', ' ').title()}").classes("text-sm")
            ui.label(f"Status: {asset.status.value.replace('_', ' ').title()}").classes("text-sm")
            if asset.version:
                ui.label(f"Version: {asset.version}").classes("text-sm")
            if asset.hardware_host:
                ui.label(f"Host: {asset.hardware_host.name}").classes("text-sm")

            # Resource information
            if asset.cpu_cores or asset.memory_gb or asset.storage_gb:
                ui.separator()
                ui.label("Resource Allocation:").classes("text-sm font-medium")
                if asset.cpu_cores:
                    ui.label(f"• CPU Cores: {asset.cpu_cores}").classes("text-sm")
                if asset.memory_gb:
                    ui.label(f"• Memory: {asset.memory_gb} GB").classes("text-sm")
                if asset.storage_gb:
                    ui.label(f"• Storage: {asset.storage_gb} GB").classes("text-sm")

            if asset.notes:
                ui.separator()
                ui.label(f"Notes: {asset.notes}").classes("text-sm")

            # Show IP allocations
            if asset.id is not None:
                ip_allocations = IPAllocationService.get_by_software_asset(asset.id)
            else:
                ip_allocations = []
            if ip_allocations:
                ui.separator()
                ui.label("IP Allocations:").classes("text-sm font-medium")
                for ip in ip_allocations:
                    ui.label(f"• {ip.ip_address}").classes("text-sm ml-4")

        ui.button("Close", on_click=dialog.close).classes("w-full mt-4")

    dialog.open()


def edit_asset(asset_id: int):
    """Edit asset in a dialog"""
    asset = SoftwareAssetService.get_by_id(asset_id)
    if asset is None:
        ui.notify("Asset not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        ui.label(f"Edit Asset: {asset.name}").classes("text-lg font-semibold mb-4")

        def on_save():
            dialog.close()
            software_assets_table.refresh()

        form = create_asset_form(asset=asset, on_save=on_save)

        with ui.column().classes("gap-4 w-full"):
            for field in form["form_fields"]:
                pass  # Fields are already created and displayed

        with ui.row().classes("gap-2 justify-end w-full mt-4"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Save Changes", on_click=form["save_function"]).classes("bg-primary text-white")

    dialog.open()


def delete_asset(asset_id: int):
    """Delete asset with confirmation"""
    asset = SoftwareAssetService.get_by_id(asset_id)
    if asset is None:
        ui.notify("Asset not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card():
        ui.label(f"Delete Asset: {asset.name}").classes("text-lg font-semibold mb-4")
        ui.label("Are you sure you want to delete this software asset? This action cannot be undone.").classes("mb-4")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Delete", on_click=lambda: confirm_delete(asset_id, dialog)).classes("bg-red-500 text-white")

    dialog.open()


def confirm_delete(asset_id: int, dialog):
    """Confirm and execute asset deletion"""
    try:
        success = SoftwareAssetService.delete(asset_id)
        if success:
            ui.notify("Software asset deleted successfully", type="positive")
            software_assets_table.refresh()
        else:
            ui.notify("Failed to delete asset", type="negative")
        dialog.close()
    except Exception as e:
        logger.error(f"Error deleting software asset: {e}")
        ui.notify(f"Error deleting asset: {str(e)}", type="negative")


def show_add_asset_dialog():
    """Show dialog for adding new asset"""
    with ui.dialog() as dialog, ui.card().classes("w-96 max-w-full"):
        ui.label("Add New Software Asset").classes("text-lg font-semibold mb-4")

        def on_save():
            dialog.close()
            software_assets_table.refresh()

        form = create_asset_form(on_save=on_save)

        with ui.column().classes("gap-4 w-full"):
            for field in form["form_fields"]:
                pass  # Fields are already created and displayed

        with ui.row().classes("gap-2 justify-end w-full mt-4"):
            ui.button("Cancel", on_click=dialog.close).props("outline")
            ui.button("Add Asset", on_click=form["save_function"]).classes("bg-primary text-white")

    dialog.open()


def create():
    """Create software assets module"""

    @ui.page("/software")
    def software_page():
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        with ui.column().classes("w-full min-h-screen bg-gray-50"):
            # Header
            with ui.card().classes("w-full mb-6 shadow-sm"):
                with ui.row().classes("items-center justify-between p-6"):
                    with ui.row().classes("items-center gap-4"):
                        ui.icon("memory", size="2em").classes("text-primary")
                        with ui.column().classes("gap-1"):
                            ui.label("Software Assets").classes("text-2xl font-bold text-gray-800")
                            ui.label("Manage VMs, containers, and software infrastructure").classes("text-gray-600")

                    with ui.row().classes("gap-2"):
                        ui.button("Dashboard", icon="dashboard", on_click=lambda: ui.navigate.to("/dashboard")).props(
                            "outline"
                        )
                        ui.button("Add Asset", icon="add", on_click=show_add_asset_dialog).classes(
                            "bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        )

            # Main content
            with ui.column().classes("flex-1 p-6"):
                software_assets_table()
