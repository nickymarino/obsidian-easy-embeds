import Embedder from "./embedder";

export default class YoutubeEmbedder implements Embedder {
	canAddEmbed(url: string): boolean {
		return this.createEmbedURL(url) != undefined;
	}

	addEmbed(parent: HTMLElement, url: string): void {
		const embedURL = this.createEmbedURL(url);
		if (!embedURL) {
			return;
		}
		console.log("printing " + embedURL);

		// Format:
		// <iframe width="560" height="315" src="https://www.youtube.com/embed/83Q4cZRQ9eY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
		const attributes = {
			src: embedURL,
			width: "560",
			height: "315",
			style: "margin-top: 10px;",
			title: "YouTube video player",
			frameborder: "0",
			allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
		};
		const frame = parent.createEl("iframe") as HTMLIFrameElement;
		Object.entries(attributes).forEach(([key, value]) => {
			frame.setAttribute(key, value);
		});
	}

	private createEmbedURL(url: string): string | undefined {
		const trimmedURL = url.trim();

		// Check for single video
		//
		// https://regex101.com/r/Oyi3N5/1
		//
		// Examples:
		// - https://youtu.be/83Q4cZRQ9eY
		// - https://www.youtube.com/watch?v=QgbLb6QCK88
		// - https://www.youtube.com/watch?v=83Q4cZRQ9eY&t=368s
		// - https://www.youtube.com/watch?v=QgbLb6QCK88&list=PL3NaIVgSlAVLHty1-NuvPa9V0b0UwbzBdV
		const videoRegex =
			/https?:\/\/(youtu\.be\/|(www\.)?youtube\.com\/watch\?v=)(?<slug>[\w\d]+(&t=\d+s)?)/;
		const videoEmbedSlug = trimmedURL.match(videoRegex)?.groups?.slug;
		if (videoEmbedSlug) {
			return `https://www.youtube.com/embed/${videoEmbedSlug}`;
		}

		// Check for playlist
		//
		// https://regex101.com/r/lI8ex8/1
		//
		// Example: https://www.youtube.com/playlist?list=PL3NaIVgSlAVLHty1-NuvPa9V0b0UwbzBd
		const playlistRegex =
			/https?:\/\/(www\.)?youtube\.com\/playlist\?list=(?<slug>\S+)/;
		const playlistSlug = trimmedURL.match(playlistRegex)?.groups?.slug;
		if (playlistSlug) {
			return `https://www.youtube.com/embed/videoseries?list=${playlistSlug}`;
		}

		return undefined;
	}
}
