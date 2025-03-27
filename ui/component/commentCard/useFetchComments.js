import { useEffect, useState } from 'react';

const truncateText = (text, maxLength = 125) => {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
};

const useFetchComments = (pinnedClaimIds, sortBy = 3) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClaimUrl = async (claimId) => {
    try {
      const response = await fetch(`https://odysee.com/$/search?q=${claimId}`, {
        mode: 'no-cors',
      });
      if (!response.ok) return `https://odysee.com/$/search?q=${claimId}`;

      const { data } = await response.json();
      const claim = data?.items?.[0];
      return claim?.canonical_url
        ? `https://odysee.com/${claim.canonical_url.replace('lbry://', '')}`
        : `https://odysee.com/$/search?q=${claimId}`;
    } catch {
      return `https://odysee.com/$/search?q=${claimId}`;
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!pinnedClaimIds || pinnedClaimIds.length === 0) return;

        const commentsPromises = pinnedClaimIds.map(async (claimId) => {
          try {
            const commentResponse = await fetch('https://comments.odysee.com/api/v2?m=comment.List', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'comment.List',
                params: {
                  claim_id: claimId,
                  page: 1,
                  page_size: 1,
                  sort_by: sortBy,
                },
              }),
            });

            if (!commentResponse.ok) return null;

            const commentData = await commentResponse.json();
            const comment = commentData.result?.items?.[0];
            if (!comment) return null;

            const claimUrl = await fetchClaimUrl(claimId);

            return {
              id: comment.comment_id,
              text: truncateText(comment.comment),
              channelName: comment.channel_name,
              claimId,
              timestamp: comment.timestamp,
              claimUrl,
              isPinned: comment.is_pinned,
            };
          } catch {
            return null;
          }
        });

        const fetchedComments = (await Promise.all(commentsPromises)).filter(Boolean);
        setComments(fetchedComments);
      } catch (err) {
        setError(err.message || 'Error loading comments');
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [pinnedClaimIds, sortBy]);

  return {
    comments,
    loading,
    error,
    refresh: () => setLoading(true),
  };
};

export default useFetchComments;
