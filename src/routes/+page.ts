export async function load({ parent, fetch }) {
	const { queryClient } = await parent();

	await queryClient.prefetchQuery({
		queryKey: ['japanSchedule'],
		queryFn: async () => {
			const response = await fetch(
				'https://sph-s-api.olympics.com/summer/schedules/api/JPN/schedule/noc/JPN'
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		}
	});
}
