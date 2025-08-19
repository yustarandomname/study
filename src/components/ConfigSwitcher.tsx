import {
  Anchor, AppShell, Button, Card, Container, Divider, Flex, Image, rem, Text,
} from '@mantine/core';
import {
  IconAlertTriangle, IconChartHistogram, IconExternalLink, IconListCheck,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  GlobalConfig, ParsedConfig, StudyConfig,
} from '../parser/types';
import { sanitizeStringForUrl } from '../utils/sanitizeStringForUrl';
import { PREFIX } from '../utils/Prefix';
import { ErrorLoadingConfig } from './ErrorLoadingConfig';
import { ParticipantStatusBadges } from '../analysis/interface/ParticipantStatusBadges';
import { useStorageEngine } from '../storage/storageEngineHooks';
import { REVISIT_MODE } from '../storage/engines/StorageEngine';
import { FirebaseStorageEngine } from '../storage/engines/FirebaseStorageEngine';
import { useAuth } from '../store/hooks/useAuth';

function StudyCard({ configName, config, url }: { configName: string; config: ParsedConfig<StudyConfig>; url: string }) {
  const { storageEngine } = useStorageEngine();

  const [studyStatusAndTiming, setStudyStatusAndTiming] = useState<{completed: number; rejected: number; inProgress: number; minTime: Timestamp | number | null; maxTime: Timestamp | number | null} | null>(null);
  useEffect(() => {
    if (!storageEngine) return;

    storageEngine.getParticipantsStatusCounts(configName).then((status) => {
      setStudyStatusAndTiming(status);
    });
  }, [configName, storageEngine]);

  const { minTime, maxTime } = useMemo(() => {
    if (!studyStatusAndTiming) return { minTime: null, maxTime: null };
    if (!studyStatusAndTiming.minTime || !studyStatusAndTiming.maxTime) return { minTime: null, maxTime: null };

    const min = typeof studyStatusAndTiming.minTime === 'number' ? new Date(studyStatusAndTiming.minTime) : studyStatusAndTiming.minTime.toDate();
    const max = typeof studyStatusAndTiming.maxTime === 'number' ? new Date(studyStatusAndTiming.maxTime) : studyStatusAndTiming.maxTime.toDate();

    return {
      minTime: min.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
      }),
      maxTime: max.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
      }),
    };
  }, [studyStatusAndTiming]);

  const [modes, setModes] = useState<Record<REVISIT_MODE, boolean> | null>(null);
  useEffect(() => {
    if (!storageEngine) return;

    storageEngine.getModes(configName).then((m) => {
      setModes(m);
    });
  }, [configName, storageEngine]);

  const currentMode = useMemo(() => {
    if (!modes) return 'Unknown';

    if (modes.dataCollectionEnabled) {
      if (studyStatusAndTiming && (studyStatusAndTiming.inProgress > 0 || studyStatusAndTiming.completed > 0)) {
        return 'Collecting Data';
      }
      return 'Ready to Collect Data';
    }
    return 'Data Collection Disabled';
  }, [modes, studyStatusAndTiming]);

  return (
    <Card key={configName} shadow="sm" radius="md" my="sm" withBorder>
      {config.errors.length > 0
        ? (
          <>
            <Text fw="bold">{configName}</Text>
            <Flex align="center" direction="row">
              <IconAlertTriangle color="red" />
              <Text fw="bold" ml={8} color="red">Errors</Text>
            </Flex>
            <ErrorLoadingConfig issues={config.errors} type="error" />
            {config.warnings.length > 0 && (
              <>
                <Flex align="center" direction="row">
                  <IconAlertTriangle color="orange" />
                  <Text fw="bold" ml={8} color="orange">Warnings</Text>
                </Flex>
                <ErrorLoadingConfig issues={config.warnings} type="warning" />
              </>
            )}
          </>
        )
        : (
          <>
            <Flex direction="row" justify="space-between">
              <Text fw="bold">
                {config.studyMetadata.title}
              </Text>
            </Flex>
            <Text c="dimmed">
              <Text span fw={500}>Authors: </Text>
              {config.studyMetadata.authors.join(', ')}
            </Text>
            <Text c="dimmed">{config.studyMetadata.description}</Text>
            <Text c="dimmed" ta="right" style={{ paddingRight: 5 }}>
              <Anchor
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                href={`${import.meta.env.VITE_REPO_URL}${url}`}
              >
                View source:
                {' '}
                {url}
                <IconExternalLink style={{
                  width: rem(18), height: rem(18), marginLeft: rem(2), marginBottom: rem(-3),
                }}
                />
              </Anchor>
            </Text>

            {config.warnings.length > 0 && (
              <>
                <Flex align="center" direction="row">
                  <IconAlertTriangle color="orange" />
                  <Text fw="bold" ml={8} color="orange">Warnings</Text>
                </Flex>
                <ErrorLoadingConfig issues={config.warnings} type="warning" />
              </>
            )}

            <Divider my="md" />

            <Flex direction="row" gap="sm">
              <Text fw="bold" size="sm" opacity={0.7}>
                Study Status:
                {' '}
                {currentMode}
              </Text>
              {studyStatusAndTiming
              && <ParticipantStatusBadges completed={studyStatusAndTiming.completed} inProgress={studyStatusAndTiming.inProgress} rejected={studyStatusAndTiming.rejected} />}
            </Flex>

            {minTime && maxTime
            && (
            <Text c="dimmed" mt={4}>
              Activity:
              {' '}
              {minTime}
              {' '}
              –
              {' '}
              {maxTime}
            </Text>
            )}

            <Flex direction="row" align="end" gap="sm" mt="md">
              <Button
                leftSection={<IconChartHistogram />}
                style={{ marginLeft: 'auto' }}
                variant="default"
                component="a"
                href={`${PREFIX}analysis/stats/${url}`}
              >
                Analyze & Manage Study
              </Button>
              <Button
                leftSection={<IconListCheck />}
                component="a"
                href={`${PREFIX}${url}`}
              >
                Go to Study
              </Button>
            </Flex>
          </>
        )}
    </Card>
  );
}

function StudyCards({ configNames, studyConfigs } : { configNames: string[]; studyConfigs: Record<string, ParsedConfig<StudyConfig> | null> }) {
  return configNames.map((configName) => {
    const config = studyConfigs[configName];
    if (!config) {
      return null;
    }
    const url = sanitizeStringForUrl(configName);

    return <StudyCard key={configName} configName={configName} config={config} url={url} />;
  });
}

export function ConfigSwitcher({
  globalConfig,
  studyConfigs,
}: {
  globalConfig: GlobalConfig;
  studyConfigs: Record<string, ParsedConfig<StudyConfig> | null>;
}) {
  const { storageEngine } = useStorageEngine();
  const { configsList } = globalConfig;

  const others = useMemo(() => configsList.filter((configName) => !configName.startsWith('demo-') && !configName.startsWith('tutorial') && !configName.startsWith('example-') && !configName.startsWith('test-') && !configName.startsWith('library-')), [configsList]);

  const [otherStudyVisibility, setOtherStudyVisibility] = useState<Record<string, boolean>>({});
  useEffect(() => {
    async function getVisibilities() {
      const visibility: Record<string, boolean> = {};
      await Promise.all(
        others.map(async (configName) => {
          if (storageEngine instanceof FirebaseStorageEngine) {
            const modes = await storageEngine.getModes(configName);
            visibility[configName] = modes.analyticsInterfacePubliclyAccessible;
          }
        }),
      );
      setOtherStudyVisibility(visibility);
    }
    getVisibilities();
  }, [others, storageEngine]);

  const { user } = useAuth();
  const othersFiltered = useMemo(() => others.filter((configName) => otherStudyVisibility[configName] || user.isAdmin), [others, otherStudyVisibility, user]);

  return (
    <AppShell.Main>
      <Container size="sm" px={0}>
        <Image
          maw={150}
          mx="auto"
          mb="xl"
          radius="md"
          src={`${PREFIX}revisitAssets/revisitLogoSquare.svg`}
          alt="reVISit"
        />
        <StudyCards configNames={othersFiltered} studyConfigs={studyConfigs} />
      </Container>
    </AppShell.Main>
  );
}
