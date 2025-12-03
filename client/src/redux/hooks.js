import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Hook to handle common Redux data-fetching patterns
 * @param {Function} fetchAction - Async thunk action (e.g., fetchDashboard)
 * @param {string} stateKey - Root selector key (e.g., 'sellerDashboard')
 * @param {boolean} refetch - Whether to force refetch (dependency tracking)
 */
export function useReduxData(fetchAction, stateKey, refetch = true) {
  const dispatch = useDispatch();
  const state = useSelector(state => state[stateKey]);

  useEffect(() => {
    if (refetch) {
      dispatch(fetchAction());
    }
  }, [refetch, dispatch, fetchAction]);

  return {
    ...state,
    dispatch
  };
}

/**
 * Hook to handle async actions with optimistic updates
 * @param {Function} asyncAction - Async thunk to dispatch
 * @param {Function} onSuccess - Callback on success
 * @param {Function} onError - Callback on error
 */
export function useAsyncAction(asyncAction, onSuccess, onError) {
  const dispatch = useDispatch();

  const execute = async (payload) => {
    try {
      const result = await dispatch(asyncAction(payload));
      if (result.meta.requestStatus === 'fulfilled') {
        onSuccess?.(result.payload);
        return result.payload;
      } else {
        onError?.(result.payload);
        return null;
      }
    } catch (e) {
      onError?.(e.message);
      return null;
    }
  };

  return execute;
}
