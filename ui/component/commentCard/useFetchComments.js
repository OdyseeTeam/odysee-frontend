/* eslint-disable no-console */
import { useEffect, useState, useCallback } from 'react';

const useFetchComments = (claimIds, sortBy = 'top') => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to truncate text to 125 characters
  const truncateText = useCallback((text, maxLength = 80) => {
    if (!text) return '';
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  }, []);

  // Function to obtain details of the memoized claim
  const fetchClaimDetails = useCallback(async (claimId) => {
    try {
      const response = await fetch('https://api.na-backend.odysee.com/api/v1/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'claim_search',
          params: {
            claim_id: claimId,
            page: 1,
            page_size: 1,
            no_totals: true,
          },
          id: Date.now(),
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.result?.items?.[0]) throw new Error('No claim data found');

      return data.result.items[0];
    } catch (err) {
      console.error(`Error fetching claim ${claimId}:`, err);
      return null;
    }
  }, []);

  // Memorized feedback function
  const fetchTopComment = useCallback(async (claimId) => {
    try {
      const response = await fetch('https://comments.odysee.com/api/v2?m=comment.List', {
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
            sort_by: sortBy === 'top' ? 3 : 1,
          },
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.result?.items?.[0]) return null;

      return data.result.items[0];
    } catch (err) {
      console.error(`Error fetching comments for claim ${claimId}:`, err);
      return null;
    }
  }, [sortBy]); // sortBy dependency

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!claimIds || claimIds.length === 0) {
          if (isMounted) setComments([]);
          return;
        }

        const commentsData = await Promise.all(
          claimIds.map(async (claimId) => {
            try {
              const [claimData, commentData] = await Promise.all([
                fetchClaimDetails(claimId),
                fetchTopComment(claimId),
              ]);

              if (!claimData || !commentData) return null;

              return {
                id: commentData.comment_id,
                claimId: claimData.claim_id,
                text: truncateText(commentData.comment),
                channelName: commentData.channel_name,
                channelThumbnail: claimData.signing_channel?.value?.thumbnail?.url,
                thumbnail: claimData.value?.thumbnail?.url,
                timestamp: commentData.timestamp,
                claimUrl: claimData.canonical_url
                  ? `https://odysee.com/${claimData.canonical_url.replace('lbry://', '')}`
                  : `https://odysee.com/$/search?q=${claimId}`,
                isPinned: commentData.is_pinned,
                fullText: commentData.comment,
              };
            } catch (err) {
              console.error(`Error processing claim ${claimId}:`, err);
              return null;
            }
          })
        );

        if (isMounted) {
          setComments(commentsData.filter(Boolean));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'An unknown error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [claimIds, sortBy, fetchClaimDetails, fetchTopComment, truncateText]);

  return {
    comments,
    loading,
    error,
    refresh: () => setLoading(true),
  };
};

export default useFetchComments;
