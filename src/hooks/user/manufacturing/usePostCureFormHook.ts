import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countPostCureFilled,
  countPostCureTotal,
  createPostCureData,
  isPostCureInhibitionOperation,
  mapPostCureInhibitorTypeToApi,
  mapPostCureOperationToApi,
} from "./postCureConfig";
import type { PostCureFormState } from "../../../data/models/user/PostCureFormModel";

type PostCureData = ReturnType<typeof createPostCureData>;

export const usePostCureFormHook = (
  initialData?: Partial<PostCureData> | PostCureFormState,
  onBlocksChange?: (payload: PostCureFormState) => void,
) => {
  const defaults = useMemo(() => createPostCureData(), []);

  const [motorId, setMotorIdState] = useState(initialData?.motorId ?? defaults.motorId);
  const [motorReceiptDate, setMotorReceiptDateState] = useState(
    initialData?.motorReceiptDate ?? defaults.motorReceiptDate,
  );
  const [operation, setOperationState] = useState(initialData?.operation ?? defaults.operation);
  const [inhibitorType, setInhibitorTypeState] = useState(
    initialData?.inhibitorType ?? defaults.inhibitorType,
  );

  useEffect(() => {
    setMotorIdState(initialData?.motorId ?? defaults.motorId);
    setMotorReceiptDateState(initialData?.motorReceiptDate ?? defaults.motorReceiptDate);
    setOperationState(initialData?.operation ?? defaults.operation);
    setInhibitorTypeState(initialData?.inhibitorType ?? defaults.inhibitorType);
  }, [initialData, defaults]);

  const data = useMemo(
    () => ({
      motorId,
      motorReceiptDate,
      operation,
      inhibitorType: isPostCureInhibitionOperation(operation) ? inhibitorType : "",
      schemaFormLoaded: initialData?.schemaFormLoaded ?? false,
      postCureSchema: initialData?.postCureSchema ?? null,
      schemaFormValues: initialData?.schemaFormValues ?? {},
      savedSections: initialData?.savedSections,
    }),
    [motorId, motorReceiptDate, operation, inhibitorType, initialData],
  );

  const notify = useCallback(
    (nextData: PostCureData) => {
      onBlocksChange?.(nextData as PostCureFormState);
    },
    [onBlocksChange],
  );

  const makeUpdater = useCallback(
    <K extends keyof PostCureData>(setter: React.Dispatch<React.SetStateAction<string>>, key: K) =>
      (value: string) => {
        setter(value);
        notify({ ...data, [key]: value } as PostCureData);
      },
    [data, notify],
  );

  const setOperation = useCallback(
    (value: string) => {
      setOperationState(value);
      notify({
        ...data,
        operation: value,
        inhibitorType: isPostCureInhibitionOperation(value) ? data.inhibitorType : "",
        schemaFormLoaded: false,
        postCureSchema: null,
        schemaFormValues: {},
      });
    },
    [data, notify],
  );

  const setInhibitorType = useCallback(
    (value: string) => {
      setInhibitorTypeState(value);
      notify({
        ...data,
        inhibitorType: value,
        schemaFormLoaded: false,
        postCureSchema: null,
        schemaFormValues: {},
      });
    },
    [data, notify],
  );

  const filled = useMemo(() => countPostCureFilled(data), [data]);
  const total = useMemo(() => countPostCureTotal(), []);
  const showInhibitionFields = isPostCureInhibitionOperation(operation);

  return {
    motorId,
    setMotorId: makeUpdater(setMotorIdState, "motorId"),
    motorReceiptDate,
    setMotorReceiptDate: makeUpdater(setMotorReceiptDateState, "motorReceiptDate"),
    operation,
    setOperation,
    inhibitorType,
    setInhibitorType,
    showInhibitionFields,
    filled,
    total,
  };
};

export default usePostCureFormHook;
