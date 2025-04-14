import { type JSX, useState } from 'react';
import { Button, TextField } from '@mui/material';

export interface Vendor {
  provider: string;
  description: string;
  type: string;
}

export const LegendMarketplaceSearchBar = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <div className="legend-marketplace__search-bar">
      <TextField
        type="search"
        placeholder="Search"
        fullWidth={true}
        value={searchQuery}
        onChange={(event) => {
          setSearchQuery(event.target.value);
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          },
        }}
      />
      <Button variant="contained">Go</Button>
    </div>
  );
};
