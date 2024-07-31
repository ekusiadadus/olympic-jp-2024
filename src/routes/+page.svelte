<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import {
		Table,
		TableBody,
		TableCaption,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Input } from '$lib/components/ui/input';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	const japanScheduleQuery = createQuery({
		queryKey: ['japanSchedule'],
		queryFn: async () => {
			const response = await fetch(
				'https://sph-s-api.olympics.com/summer/schedules/api/JPN/schedule/noc/JPN'
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = await response.json();
			console.log('API Response:', data);
			return data;
		}
	});

	function getFlagEmoji(countryCode) {
		if (!countryCode) return '🏳️'; // デフォルトの旗を返す

		const codePoints = countryCode
			.toUpperCase()
			.split('')
			.map((char) => 127397 + char.charCodeAt());
		return String.fromCodePoint(...codePoints);
	}
	function getResultDisplay(competitor) {
		if (!competitor.results || competitor.results.mark === undefined) {
			return '試合前';
		}
		const mark = competitor.results.mark;
		const winnerLoserTie = competitor.results.winnerLoserTie;
		return `${mark} (${winnerLoserTie === 'W' ? '勝' : winnerLoserTie === 'L' ? '敗' : '引き分け'})`;
	}

	function getOpponents(competitors) {
		return competitors.filter((competitor) => competitor.noc !== 'JPN').map((c) => c.name);
	}

	let selectedDate = '';
	let tableContainer;

	function filterByDate(units) {
		if (!selectedDate) return units;
		return units.filter(
			(unit) => new Date(unit.startDate).toLocaleDateString('ja-JP') === selectedDate
		);
	}

	onMount(() => {
		const now = new Date();
		const currentTime = now.getHours() * 60 + now.getMinutes();

		if (tableContainer && $japanScheduleQuery.data) {
			const rows = tableContainer.querySelectorAll('tr');
			let closestRow;
			let minDiff = Infinity;

			rows.forEach((row) => {
				const timeCell = row.querySelector('td:nth-child(4)');
				if (timeCell) {
					const [hours, minutes] = timeCell.textContent.split(':').map(Number);
					const rowTime = hours * 60 + minutes;
					const diff = Math.abs(rowTime - currentTime);
					if (diff < minDiff) {
						minDiff = diff;
						closestRow = row;
					}
				}
			});

			if (closestRow) {
				closestRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}
	});
</script>

<div class="space-y-4">
	<Input type="date" bind:value={selectedDate} class="w-full max-w-sm" />

	{#if $japanScheduleQuery.isLoading}
		<p class="text-center">読み込み中...</p>
	{:else if $japanScheduleQuery.isError}
		<p class="text-center text-error-500">
			エラーが発生しました: {$japanScheduleQuery.error.message}
		</p>
	{:else if $japanScheduleQuery.data && $japanScheduleQuery.data.units}
		<div class="overflow-x-auto" bind:this={tableContainer}>
			<Table>
				<TableCaption>日本のスケジュール</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead class="w-1/7">競技</TableHead>
						<TableHead class="w-1/7">イベント</TableHead>
						<TableHead class="w-1/7">日付</TableHead>
						<TableHead class="w-1/7">開始時間</TableHead>
						<TableHead class="w-1/7">会場</TableHead>
						<TableHead class="w-1/7">対戦相手 🇯🇵</TableHead>
						<TableHead class="w-1/7">結果</TableHead>
					</TableRow>
				</TableHeader>

				<TableBody>
					{#each filterByDate($japanScheduleQuery.data.units) as unit}
						<TableRow>
							<TableCell class="truncate">{unit.disciplineName}</TableCell>
							<TableCell class="truncate">{unit.eventUnitName}</TableCell>
							<TableCell>{new Date(unit.startDate).toLocaleDateString('ja-JP')}</TableCell>
							<TableCell>
								{new Date(unit.startDate).toLocaleTimeString('ja-JP', {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</TableCell>
							<TableCell class="truncate">{unit.venueDescription}</TableCell>
							<TableCell>
								{#if getOpponents(unit.competitors).length > 0}
									<Popover>
										<PopoverTrigger asChild>
											<Button variant="outline" class="w-full">
												{getFlagEmoji(unit.competitors.find((c) => c.noc !== 'JPN').noc)}
												{getOpponents(unit.competitors)[0]}
												{#if getOpponents(unit.competitors).length > 1}
													<span class="ml-1">+{getOpponents(unit.competitors).length - 1}</span>
												{/if}
											</Button>
										</PopoverTrigger>
										<PopoverContent class="w-80">
											<div class="grid gap-4">
												<div class="space-y-2">
													<h4 class="font-medium leading-none">対戦相手</h4>
													<p class="text-sm text-muted-foreground">
														{#each getOpponents(unit.competitors) as opponent, i}
															{getFlagEmoji(unit.competitors.find((c) => c.name === opponent).noc)}
															{opponent}
															{#if i < getOpponents(unit.competitors).length - 1},
															{/if}
														{/each}
													</p>
												</div>
											</div>
										</PopoverContent>
									</Popover>
								{:else}
									-
								{/if}
							</TableCell>
							<TableCell>
								{#each unit.competitors as competitor}
									{#if competitor.noc === 'JPN'}
										{getResultDisplay(competitor)}
									{/if}
								{/each}
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
		</div>
	{:else}
		<p class="text-center">データが見つかりません。</p>
	{/if}
</div>
