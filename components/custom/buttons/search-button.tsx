import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SearchButton = () => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchEntityUrl, setSearchEntityUrl] = useState<string>("");

  const redirectWithSearchValue = () => {
    if (!searchEntityUrl || !searchValue) {
      return;
    }

    router.push(`${searchEntityUrl}?searchValue=${searchValue}`);
  };

  return (
    <Popover>
      <PopoverTrigger>
        <div className="cursor-pointer rounded-md border p-3 hover:bg-gray-50">
          <Search className="h-4 w-4" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="mr-16 space-y-4">
        <div className="space-y-1">
          <h4 className="font-semibold">Search entities</h4>
          <p className="text-sm text-muted-foreground">
            Choose an entity and value you want to search on
          </p>
        </div>
        <Select onValueChange={(value) => setSearchEntityUrl(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a search entity" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="/clients">Client</SelectItem>
              <SelectItem value="/projects">Project</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input
          placeholder="Search"
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={() => redirectWithSearchValue()}>Search</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchButton;
