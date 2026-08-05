extends Node3D

const LANES := [-3.0, 0.0, 3.0]
const SPEED := 15.0
const LANE_SPEED := 10.0
const JUMP_SPEED := 9.0
const GRAVITY := 24.0

var lane := 1
var velocity_y := 0.0
var ground_y := 1.4
var distance := 0.0

@onready var runner: Node3D = $Runner
@onready var camera: Camera3D = $Camera3D
@onready var city: Node3D = $City

func _ready():
	create_city()
	create_track_details()

func _process(delta):
	distance += SPEED * delta

	var target_x = LANES[lane]
	runner.position.x = move_toward(
		runner.position.x,
		target_x,
		LANE_SPEED * delta
	)

	if runner.position.y > ground_y or velocity_y > 0.0:
		velocity_y -= GRAVITY * delta
		runner.position.y += velocity_y * delta

		if runner.position.y <= ground_y:
			runner.position.y = ground_y
			velocity_y = 0.0

	$Road.position.z += SPEED * delta

	if $Road.position.z > 10.0:
		$Road.position.z = -45.0

	for child in city.get_children():
		child.position.z += SPEED * delta
		if child.position.z > 18.0:
			child.position.z -= 150.0

	camera.position.x = lerp(
		camera.position.x,
		runner.position.x * 0.32,
		delta * 4.0
	)

func _unhandled_input(event):
	if event is InputEventScreenTouch and event.pressed:
		var width = get_viewport().get_visible_rect().size.x
		var height = get_viewport().get_visible_rect().size.y

		if event.position.y < height * 0.42:
			jump()
		elif event.position.x < width * 0.5:
			move_left()
		else:
			move_right()

	if event.is_action_pressed("ui_left"):
		move_left()

	if event.is_action_pressed("ui_right"):
		move_right()

	if event.is_action_pressed("ui_accept"):
		jump()

func move_left():
	lane = max(0, lane - 1)

func move_right():
	lane = min(2, lane + 1)

func jump():
	if abs(runner.position.y - ground_y) < 0.05:
		velocity_y = JUMP_SPEED

func neon_material(color: Color) -> StandardMaterial3D:
	var mat = StandardMaterial3D.new()
	mat.albedo_color = color
	mat.metallic = 0.55
	mat.roughness = 0.22
	mat.emission_enabled = true
	mat.emission = color
	mat.emission_energy_multiplier = 2.8
	return mat

func add_box(
	parent: Node3D,
	pos: Vector3,
	size: Vector3,
	color: Color
):
	var mesh_instance = MeshInstance3D.new()
	var mesh = BoxMesh.new()
	mesh.size = size
	mesh.material = neon_material(color)
	mesh_instance.mesh = mesh
	mesh_instance.position = pos
	parent.add_child(mesh_instance)

func create_city():
	var colors = [
		Color(0.04, 0.55, 1.0),
		Color(0.75, 0.04, 1.0),
		Color(1.0, 0.08, 0.48),
		Color(0.05, 1.0, 0.78)
	]

	for i in range(24):
		var z = -8.0 - i * 6.0
		var h = 5.0 + float((i * 7) % 12)

		add_box(
			city,
			Vector3(-9.0 - float(i % 3), h / 2.0 - 0.2, z),
			Vector3(4.5, h, 4.0),
			colors[i % colors.size()]
		)

		add_box(
			city,
			Vector3(9.0 + float((i + 1) % 3), h / 2.0 - 0.2, z - 2.5),
			Vector3(4.5, h + 2.0, 4.0),
			colors[(i + 2) % colors.size()]
		)

func create_track_details():
	for i in range(16):
		var z = 2.0 - i * 7.0

		add_box(
			city,
			Vector3(-2.0, 0.05, z),
			Vector3(0.09, 0.04, 3.2),
			Color(0.0, 0.8, 1.0)
		)

		add_box(
			city,
			Vector3(2.0, 0.05, z),
			Vector3(0.09, 0.04, 3.2),
			Color(0.85, 0.05, 1.0)
		)

	for i in range(10):
		var z = -12.0 - i * 11.0
		var x = LANES[(i * 2) % 3]

		add_box(
			city,
			Vector3(x, 0.65, z),
			Vector3(1.8, 1.3, 0.65),
			Color(1.0, 0.16, 0.42)
		)

	for i in range(18):
		var z = -6.0 - i * 5.5
		var x = LANES[(i + 1) % 3]

		var crystal = MeshInstance3D.new()
		var mesh = SphereMesh.new()
		mesh.radius = 0.32
		mesh.height = 0.64
		mesh.material = neon_material(
			Color(0.1, 1.0, 0.82)
		)

		crystal.mesh = mesh
		crystal.position = Vector3(x, 1.25, z)
		city.add_child(crystal)
