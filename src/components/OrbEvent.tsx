import * as THREE from "three";

interface OrbEventProps {
	radius?: number;
	color?: number;
	position?: THREE.Vector3;
	onClick?: () => void;
}

export function createOrbEvent({
	radius = 2,
	color = 0xffffff,
	position = new THREE.Vector3(0, 0, 0),
}: OrbEventProps) {
	const group = new THREE.Group();

	// For orb
	const orbGeometry = new THREE.SphereGeometry(radius, 32, 2);
	const orbMaterial = new THREE.MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: 2,
	});
	const orb = new THREE.Mesh(orbGeometry, orbMaterial);
	orb.position.copy(position);
	orb.userData = { isClickable: true, onclick };

	// For torus ring around orb
	const torusGeometry = new THREE.TorusGeometry(radius * 1.3, radius * 0.15, 16, 100);
	const torusMaterial = new THREE.MeshStandardMaterial({
		color,
		emissive: color,
		emissiveIntensity: 2,
	});
	const torus = new THREE.Mesh(torusGeometry, torusMaterial);
	torus.position.copy(position);
	torus.userData = { isClickable: true, onclick };

	group.add(orb);
	group.add(torus);

	return { group, orb, torus };
}