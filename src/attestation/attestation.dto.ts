import type { RegistrationResponseJSON } from '@simplewebauthn/server';

export type AttestationSelectorDto = {
  username: string;
  displayName: string;
  authenticatorSelection: AuthenticatorSelectionCriteria;
  attestationType?: AttestationConveyancePreference;
  extensions?: LiquidAttestationExtensionsClientInput;
};
export type AttestationCredentialJSONDto = RegistrationResponseJSON & {
  clientExtensionResults: LiquidAuthClientExtensionResults;
};

export type LiquidAuthClientExtensionResults = {
  liquid: {
    type: 'algorand' | 'falcon-1024' | 'solana';
    signature: string;
    address: string;
    publicKey?: string;

    device?: string;
    requestId?: string;
  };
};
export type LiquidAttestationExtensionsClientInput =
  AuthenticationExtensionsClientInputs & {
    liquid: boolean;
  };
