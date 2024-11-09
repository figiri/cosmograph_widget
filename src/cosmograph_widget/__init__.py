import importlib.metadata
import pathlib

import pyarrow as pa
import anywidget
from traitlets import Bool, Float, List, Int, Unicode, Union, Bytes, Any, observe

try:
    __version__ = importlib.metadata.version("cosmograph_widget")
except importlib.metadata.PackageNotFoundError:
    __version__ = "unknown"


class Cosmograph(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "widget.js"
    _css = pathlib.Path(__file__).parent / "static" / "widget.css"
    
    # Configuration parameters for Cosmograph
    # List of all configuration parameters that JS side support can be found in ./js/config-props.ts

    # Parameters based on parameters from Cosmos (https://github.com/cosmograph-org/cosmos/blob/main/src/config.ts)
    disable_simulation = Bool(None, allow_none=True).tag(sync=True)
    simulation_decay = Float(None, allow_none=True).tag(sync=True)
    simulation_gravity = Float(None, allow_none=True).tag(sync=True)
    simulation_center = Float(None, allow_none=True).tag(sync=True)
    simulation_repulsion = Float(None, allow_none=True).tag(sync=True)
    simulation_repulsion_theta = Float(None, allow_none=True).tag(sync=True)
    simulation_repulsion_quadtree_levels = Float(None, allow_none=True).tag(sync=True)
    simulation_link_spring = Float(None, allow_none=True).tag(sync=True)
    simulation_link_distance = Float(None, allow_none=True).tag(sync=True)
    simulation_link_dist_random_variation_range = List(None, default_value=None, allow_none=True).tag(sync=True)
    simulation_repulsion_from_mouse = Float(None, allow_none=True).tag(sync=True)
    simulation_friction = Float(None, allow_none=True).tag(sync=True)

    background_color = Union([Unicode(None, allow_none=True), List(Float, allow_none=True)]).tag(sync=True)
    space_size = Int(None, allow_none=True).tag(sync=True)
    default_point_color = Union([Unicode(None, allow_none=True), List(Float, allow_none=True)]).tag(sync=True)
    point_greyout_opacity = Float(None, allow_none=True).tag(sync=True)
    default_point_size = Float(None, allow_none=True).tag(sync=True)
    point_size_scale = Float(None, allow_none=True).tag(sync=True)
    hovered_point_cursor = Unicode(None, allow_none=True).tag(sync=True)
    render_hovered_point_ring = Bool(None, allow_none=True).tag(sync=True)
    hovered_point_ring_color = Union([Unicode(None, allow_none=True), List(Float, allow_none=True)]).tag(sync=True)
    focused_point_ring_color = Union([Unicode(None, allow_none=True), List(Float, allow_none=True)]).tag(sync=True)
    focused_point_index = Int(None, allow_none=True).tag(sync=True)
    render_links = Bool(None, allow_none=True).tag(sync=True)
    default_link_color = Union([Unicode(None, allow_none=True), List(Float, allow_none=True)]).tag(sync=True)
    link_greyout_opacity = Float(None, allow_none=True).tag(sync=True)
    default_link_width = Float(None, allow_none=True).tag(sync=True)
    link_width_scale = Float(None, allow_none=True).tag(sync=True)
    curved_links = Bool(None, allow_none=True).tag(sync=True)
    curved_link_segments = Int(None, allow_none=True).tag(sync=True)
    curved_link_weight =  Float(None, allow_none=True).tag(sync=True)
    curved_link_control_point_distance = Float(None, allow_none=True).tag(sync=True)
    default_link_arrows = Bool(None, allow_none=True).tag(sync=True)
    link_arrows_size_scale = Float(None, allow_none=True).tag(sync=True)
    link_visibility_distance_range = List(Float, default_value=None, allow_none=True).tag(sync=True)
    link_visibility_min_transparency = Float(None, allow_none=True).tag(sync=True)
    use_quadtree = Bool(None, allow_none=True).tag(sync=True)
    show_FPS_monitor = Bool(None, allow_none=True).tag(sync=True)
    pixel_ratio = Float(None, allow_none=True).tag(sync=True)
    scale_points_on_zoom = Bool(None, allow_none=True).tag(sync=True)
    initial_zoom_level = Float(None, allow_none=True).tag(sync=True)
    disable_zoom = Bool(None, allow_none=True).tag(sync=True)
    enable_drag = Bool(None, allow_none=True).tag(sync=True)
    fit_view_on_init = Bool(None, allow_none=True).tag(sync=True)
    fit_view_delay = Float(None, allow_none=True).tag(sync=True)
    fit_view_padding = Float(None, allow_none=True).tag(sync=True)
    fit_view_duration = Float(None, allow_none=True).tag(sync=True)
    fit_view_by_points_in_rect = List(List(Float), default_value=None, allow_none=True).tag(sync=True)
    random_seed = Union([Int(None, allow_none=True), Unicode(None, allow_none=True)]).tag(sync=True)
    point_sampling_distance = Int(None, allow_none=True).tag(sync=True)

    # Parameters based on parameters from Cosmograph library
    point_id = Unicode(None, allow_none=True).tag(sync=True)
    point_index = Unicode(None, allow_none=True).tag(sync=True)
    point_color = Unicode(None, allow_none=True).tag(sync=True)
    point_size = Unicode(None, allow_none=True).tag(sync=True)
    point_label  = Unicode(None, allow_none=True).tag(sync=True)
    point_label_weight = Unicode(None, allow_none=True).tag(sync=True)
    point_x = Unicode(None, allow_none=True).tag(sync=True)
    point_y = Unicode(None, allow_none=True).tag(sync=True)
    point_include_columns = List(Unicode, default_value=None, allow_none=True).tag(sync=True)

    link_source = Unicode(None, allow_none=True).tag(sync=True)
    link_source_index = Unicode(None, allow_none=True).tag(sync=True)
    link_target = Unicode(None, allow_none=True).tag(sync=True)
    link_target_index = Unicode(None, allow_none=True).tag(sync=True)
    link_color = Unicode(None, allow_none=True).tag(sync=True)
    link_width = Unicode(None, allow_none=True).tag(sync=True)
    link_arrow = Unicode(None, allow_none=True).tag(sync=True)
    link_strength = Unicode(None, allow_none=True).tag(sync=True)
    link_include_columns = List(Unicode, default_value=None, allow_none=True).tag(sync=True)

    show_dynamic_labels = Bool(None, allow_none=True).tag(sync=True)
    show_labels_for = List(Unicode, allow_none=True).tag(sync=True)
    show_top_labels = Bool(None, allow_none=True).tag(sync=True)
    show_top_labels_limit = Int(None, allow_none=True).tag(sync=True)
    show_top_labels_by = Unicode(None, allow_none=True).tag(sync=True)
    static_label_weight = Float(None, allow_none=True).tag(sync=True)
    dynamic_label_weight = Float(None, allow_none=True).tag(sync=True)
    label_padding = Float(None, allow_none=True).tag(sync=True)
    show_hovered_point_label = Bool(None, allow_none=True).tag(sync=True)

    # Not related to Cosmograph configuration settings
    disable_point_size_legend = Bool(None, allow_none=True).tag(sync=True)
    disable_link_width_legend = Bool(None, allow_none=True).tag(sync=True)
    disable_point_color_legend = Bool(None, allow_none=True).tag(sync=True)
    disable_link_color_legend = Bool(None, allow_none=True).tag(sync=True)

    # Points and links are Pandas DataFrames that will be passed
    # to the JS side widget as an IPC (Inter-Process Communication) stream
    _ipc_points = Bytes(None, allow_none=True).tag(sync=True)
    points = Any()
    
    _ipc_links = Bytes(None, allow_none=True).tag(sync=True)
    links = Any()

    # The following are used to store values from JS side widget
    clicked_point_index = Int(None, allow_none=True).tag(sync=True)
    selected_point_indices = List(Int, allow_none=True).tag(sync=True)

    # Convert a Pandas DataFrame into a binary format and then write it to an IPC (Inter-Process Communication) stream.
    # The `with` statement ensures that the IPC stream is properly closed after writing the data.
    def get_buffered_arrow_table(self, df):
        # TODO: Add support for input data with different formats (e.g. CSV, Appache Arrow, DuckDB, etc.)
        table = pa.Table.from_pandas(df)
        sink = pa.BufferOutputStream()
        with pa.ipc.new_stream(sink, table.schema) as writer:
            writer.write(table)
        buffer = sink.getvalue()
        return buffer.to_pybytes()

    @observe("points")
    def changePoints(self, change):
        points = change.new
        points_int32 = points.select_dtypes(include=['int64']).astype('int32')
        points[points_int32.columns] = points_int32
        self._ipc_points = self.get_buffered_arrow_table(points)
    
    @observe("links")
    def changeLinks(self, change):
        links = change.new
        links_int32 = links.select_dtypes(include=['int64']).astype('int32')
        links[links_int32.columns] = links_int32
        self._ipc_links = self.get_buffered_arrow_table(links)

    # Public cosmograph widget methods that can be called from Python
    # to interact with the Cosmograph 👇
    def select_point_by_index(self, index):
        self.send({ "type": "select_point_by_index", "index": index })
    def select_points_by_indices(self, indices):
        self.send({ "type": "select_points_by_indices", "indices": indices })

    def activate_rect_selection(self):
        self.send({ "type": "activate_rect_selection" })
    def deactivate_rect_selection(self):
        self.send({ "type": "deactivate_rect_selection" })

    def fit_view(self):
        self.send({ "type": "fit_view" })
    def fit_view_by_indices(self, indices, duration=None, padding=None):
        self.send({ "type": "fit_view_by_indices", "indices": indices, "duration": duration, "padding": padding })
    def fit_view_by_coordinates(self, coordinates, duration=None, padding=None):
        self.send({ "type": "fit_view_by_coordinates", "coordinates": coordinates, "duration": duration, "padding": padding })

    def focus_point(self, index=None):
        self.send({ "type": "focus_point", "index": index })
    
    def start(self, alpha=None):
        self.send({ "type": "start", "alpha": alpha })
    def pause(self):
        self.send({ "type": "pause" })
    def restart(self):
        self.send({ "type": "restart" })
    def step(self):
        self.send({ "type": "step" })