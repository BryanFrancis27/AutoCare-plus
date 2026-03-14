/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = (() => {
	if (!supabaseUrl) return undefined;
	try {
		return new URL(supabaseUrl).hostname;
	} catch {
		return undefined;
	}
})();

const nextConfig = {
	images: {
		remotePatterns: [
			...(supabaseHostname
				? [
						{
							protocol: "https",
							hostname: supabaseHostname,
							pathname: "/storage/v1/object/public/**",
						},
					]
				: []),
		],
	},
};

export default nextConfig;
